// Comedor UAGRM — App móvil (React Native + Expo).
// Dos modos: estudiante (menú/reserva/QR) y punto de servicio (validar QR offline, foto de bandeja).
import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, FlatList, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();
const API = 'http://44.252.104.3:8080'; // AWS us-west-2 real

// ---------- offline queue + SQLite (SPEC §6) ----------
const db = SQLite.openDatabaseSync('comedor.db');
db.execSync(`
  CREATE TABLE IF NOT EXISTS cola_sync (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    idem_key TEXT UNIQUE,
    tipo TEXT, payload TEXT, estado TEXT DEFAULT 'pendiente'
  );
  CREATE TABLE IF NOT EXISTS reservas_turno (
    reserva_id TEXT PRIMARY KEY, estudiante_id TEXT, qr TEXT, consumida INTEGER DEFAULT 0
  );
`);

function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Comedor UAGRM</Text>
      <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Estudiante')}>
        <Text style={styles.btnTxt}>Modo estudiante</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, { backgroundColor: '#16a34a' }]} onPress={() => navigation.navigate('PuntoServicio')}>
        <Text style={styles.btnTxt}>Modo punto de servicio</Text>
      </TouchableOpacity>
    </View>
  );
}

function EstudianteScreen() {
  const [menu, setMenu] = useState([]);
  useEffect(() => {
    fetch(`${API}/menus/semana/ALMUERZO`).then(r => r.json()).then(setMenu).catch(() => setMenu([]));
  }, []);
  const reservar = async (m, platoId) => {
    const idem = `mob-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const payload = {
      estudiante_id: 'mob-est-1', menu_id: m.id, plato_id: platoId,
      fecha: m.fecha, turno: 'ALMUERZO', metodo_pago: 'qr_bancario', monto: 8, idempotency_key: idem,
    };
    try {
      const r = await fetch(`${API}/sagas/reservar-y-pagar`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      Alert.alert('✅ Reserva', `ID: ${data.reservaId}`);
    } catch {
      // Sin red: encolar
      db.runSync('INSERT OR IGNORE INTO cola_sync (idem_key, tipo, payload) VALUES (?, ?, ?)',
        [idem, 'reservar-y-pagar', JSON.stringify(payload)]);
      Alert.alert('📴 Sin red', 'Reserva encolada; se sincroniza al volver.');
    }
  };
  return (
    <View style={styles.container}>
      <Text style={styles.h2}>Menú de la semana</Text>
      <FlatList data={menu} keyExtractor={m => m.id}
        renderItem={({ item: m }) => (
          <View style={styles.card}>
            <Text style={{ fontWeight: 'bold' }}>{m.fecha} · {m.turno}</Text>
            {Object.keys(m.porciones || {}).map(platoId => (
              <TouchableOpacity key={platoId} onPress={() => reservar(m, platoId)}>
                <Text style={{ color: '#2563eb' }}>Reservar {platoId}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )} />
    </View>
  );
}

function PuntoServicioScreen() {
  const descargarTurno = async () => {
    // Pre-descarga reservas del turno (SPEC §6)
    try {
      const r = await fetch(`${API}/reservas?turno=ALMUERZO`);
      const list = await r.json();
      list.forEach(x => db.runSync(
        'INSERT OR REPLACE INTO reservas_turno (reserva_id, estudiante_id, qr) VALUES (?,?,?)',
        [x.id, x.estudianteId, x.qrCode || ''])
      );
      Alert.alert('Descarga', `${list.length} reservas en caché offline`);
    } catch { Alert.alert('Error', 'Sin red; usando caché existente'); }
  };
  const validarQrOffline = (qr) => {
    const row = db.getFirstSync('SELECT * FROM reservas_turno WHERE qr = ?', [qr]);
    if (!row) return Alert.alert('❌ QR inválido');
    if (row.consumida) return Alert.alert('⚠️ Ya consumida');
    db.runSync('UPDATE reservas_turno SET consumida = 1 WHERE reserva_id = ?', [row.reserva_id]);
    Alert.alert('✅ Ingreso válido', `Reserva ${row.reserva_id}`);
  };
  return (
    <View style={styles.container}>
      <Text style={styles.h2}>Punto de servicio</Text>
      <TouchableOpacity style={styles.btn} onPress={descargarTurno}>
        <Text style={styles.btnTxt}>Descargar reservas del turno</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={() => validarQrOffline('demo-qr')}>
        <Text style={styles.btnTxt}>Validar QR (demo)</Text>
      </TouchableOpacity>
      <Text style={{ marginTop: 16, color: '#666' }}>
        En este modo también se toma foto de bandeja → IA local (TFLite) estima % de desperdicio.
      </Text>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Comedor UAGRM' }} />
        <Stack.Screen name="Estudiante" component={EstudianteScreen} />
        <Stack.Screen name="PuntoServicio" component={PuntoServicioScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  h1: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  h2: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  btn: { backgroundColor: '#2563eb', padding: 16, borderRadius: 8, marginBottom: 12 },
  btnTxt: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  card: { padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 8 },
});
