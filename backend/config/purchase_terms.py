"""Termos de compra — versão e cláusulas exibidas ao cliente."""

PURCHASE_TERMS_VERSION = "2026-06-01"

PURCHASE_TERMS_TITLE = "Termo de Compra e Garantia de Entrega"

PURCHASE_TERMS_CLAUSES: list[str] = [
    "Ao finalizar o pedido, você contrata a compra dos itens listados pelo valor total informado.",
    "O pagamento via PIX deve usar o QR code ou chave gerados para este pedido (TXID vinculado). Pagamentos sem vínculo ao pedido não serão aceitos.",
    "A loja só confirma o recebimento do pagamento após você informar a referência do comprovante e o administrador validar o PIX.",
    "Após a confirmação do pagamento, a loja se compromete a preparar e entregar (ou disponibilizar retirada) dos produtos em até 7 dias úteis, salvo acordo diferente com o comprador.",
    "O status do pedido ficará registrado: aguardando pagamento → pagamento informado → pago → entregue. Você pode acompanhar em Minhas compras.",
    "Somente após marcar o pedido como entregue a obrigação de envio da loja é considerada cumprida no sistema.",
    "Se o pagamento for confirmado e a entrega não ocorrer no prazo, registre o problema pelo contato da loja e guarde o comprovante PIX e o número do pedido.",
    "Em caso de descumprimento, o comprador pode solicitar cancelamento/reembolso conforme o Código de Defesa do Consumidor; este registro digital (pedido, termos aceitos, datas) serve como evidência da transação.",
    "A loja não pode alterar unilateralmente o valor ou os itens do pedido após sua criação.",
]

DELIVERY_COMMITMENT_DAYS = 7
