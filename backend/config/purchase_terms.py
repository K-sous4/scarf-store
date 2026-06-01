"""Termos de compra — textos dinâmicos conforme prazo de entrega."""

PURCHASE_TERMS_TITLE = "Termo de Compra e Garantia de Entrega"

DEFAULT_DELIVERY_COMMITMENT_DAYS = 7


def terms_version_for_days(days: int) -> str:
    return f"2026-06-01-d{days}"


def normalize_delivery_days(days: int | None) -> int:
    if days is None:
        return DEFAULT_DELIVERY_COMMITMENT_DAYS
    return max(1, min(60, int(days)))


def build_summary(days: int) -> str:
    return (
        "Pagamento vinculado ao pedido, confirmacao em duas etapas e registro de entrega "
        f"pela loja em ate {days} dias uteis apos o pagamento confirmado."
    )


def build_clauses(days: int) -> list[str]:
    return [
        "Ao finalizar o pedido, você contrata a compra dos itens listados pelo valor total informado.",
        "O pagamento via PIX deve usar o QR code ou chave gerados para este pedido (TXID vinculado). Pagamentos sem vínculo ao pedido não serão aceitos.",
        "A loja só confirma o recebimento do pagamento após você informar a referência do comprovante e o administrador validar o PIX.",
        (
            f"Após a confirmação do pagamento, a loja se compromete a preparar e entregar "
            f"(ou disponibilizar retirada) dos produtos em até {days} dias úteis, salvo acordo diferente com o comprador."
        ),
        "O status do pedido ficará registrado: aguardando pagamento → pagamento informado → pago → entregue. Você pode acompanhar em Minhas compras.",
        "Somente após marcar o pedido como entregue a obrigação de envio da loja é considerada cumprida no sistema.",
        (
            f"Se o pagamento for confirmado e a entrega não ocorrer em até {days} dias úteis, "
            "registre o problema pelo contato da loja e guarde o comprovante PIX e o número do pedido."
        ),
        "Em caso de descumprimento, o comprador pode solicitar cancelamento/reembolso conforme o Código de Defesa do Consumidor; este registro digital (pedido, termos aceitos, datas) serve como evidência da transação.",
        "A loja não pode alterar unilateralmente o valor ou os itens do pedido após sua criação.",
    ]
