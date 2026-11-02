<?php
declare(strict_types=1);

namespace App\Infrastructure\Adapters\QrBancario;

use App\Application\Ports\Outbound\PaymentGatewayPort;
use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\Writer\PngWriter;
use Psr\Log\LoggerInterface;
use Stripe\StripeClient;

/**
 * Adaptador QR bancario real contra Stripe.
 * Crea un Payment Link (Stripe hosted) y devuelve URL + QR PNG en base64.
 * El estudiante escanea el QR con su app bancaria y Stripe captura el cobro.
 */
final class StripeQrAdapter implements PaymentGatewayPort
{
    private StripeClient $stripe;

    public function __construct(
        string $secretKey,
        private readonly LoggerInterface $log,
    ) {
        $this->stripe = new StripeClient($secretKey);
    }

    public function cobrarQr(float $monto, string $referencia): array
    {
        try {
            // Monto en centavos
            $amount = (int) round($monto * 100);

            // 1) Crear producto one-off
            $product = $this->stripe->products->create([
                'name' => "Ración comedor UAGRM — ref $referencia",
            ]);

            // 2) Precio
            $price = $this->stripe->prices->create([
                'unit_amount' => $amount,
                'currency' => 'usd',
                'product' => $product->id,
            ]);

            // 3) Payment Link
            $link = $this->stripe->paymentLinks->create([
                'line_items' => [[
                    'price' => $price->id,
                    'quantity' => 1,
                ]],
                'metadata' => ['referencia' => $referencia],
            ]);

            // 4) QR del Payment Link URL
            $qrPng = Builder::create()
                ->writer(new PngWriter())
                ->data($link->url)
                ->size(300)
                ->margin(10)
                ->build();

            $qrDataUri = 'data:image/png;base64,' . base64_encode($qrPng->getString());

            $this->log->info("Stripe Payment Link creado: $link->url");
            return [
                'ok' => true,
                'referencia' => $link->id,
                'paymentUrl' => $link->url,
                'qrDataUri' => $qrDataUri,
            ];
        } catch (\Throwable $e) {
            $this->log->error("Stripe falló: " . $e->getMessage());
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Verifica contra Stripe si el Payment Link fue pagado.
     * Devuelve ['paid'=>bool,'status'=>string,'amount'=>int].
     * Un Payment Link puede generar múltiples checkout sessions:
     * si al menos una está 'paid' consideramos la referencia pagada.
     */
    public function verificarPago(string $paymentLinkId): array
    {
        try {
            $sessions = $this->stripe->checkout->sessions->all([
                'payment_link' => $paymentLinkId,
                'limit' => 10,
            ]);
            foreach ($sessions->data as $s) {
                if (($s->payment_status ?? '') === 'paid') {
                    return [
                        'paid' => true,
                        'status' => 'paid',
                        'amount' => $s->amount_total ?? 0,
                        'sessionId' => $s->id,
                        'currency' => $s->currency ?? 'usd',
                    ];
                }
            }
            // Ninguna session paid todavía
            $last = $sessions->data[0] ?? null;
            return [
                'paid' => false,
                'status' => $last ? ($last->payment_status ?? 'open') : 'no_sessions',
                'sessionId' => $last?->id,
            ];
        } catch (\Throwable $e) {
            $this->log->error("Stripe verificar falló: " . $e->getMessage());
            return ['paid' => false, 'status' => 'error', 'error' => $e->getMessage()];
        }
    }

    public function devolver(string $referencia): bool
    {
        try {
            // En producción harías refund del PaymentIntent asociado.
            // Para demo: desactivar el payment link.
            $this->stripe->paymentLinks->update($referencia, ['active' => false]);
            return true;
        } catch (\Throwable $e) {
            $this->log->error("Stripe refund falló: " . $e->getMessage());
            return false;
        }
    }
}
