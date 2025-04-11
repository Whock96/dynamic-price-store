
  const renderPrintableOrderHTML = (order: any, companyInfo: any) => {
    // Determine invoice type text based on fullInvoice flag
    const invoiceTypeText = order.fullInvoice ? 'Nota Cheia' : 'Meia Nota';
    
    // Show percentage only if it's a half invoice
    const halfInvoiceText = !order.fullInvoice && order.halfInvoicePercentage ? 
      `(${order.halfInvoicePercentage}%)` : '';
      
    // Calculate tax substitution value if applicable
    let taxSubstitutionValue = 0;
    if (order.taxSubstitution) {
      // Using 7.8% which is the standard tax substitution rate in the system
      taxSubstitutionValue = (7.8 / 100) * order.subtotal;
    }
    
    // Calculate IPI if applicable
    const ipiValue = (order.withIPI || order.with_ipi) ? (order.ipiValue || order.ipi_value || 0) : 0;

    // Calculate total weight and volumes
    let totalWeight = 0;
    let totalVolumes = 0;
    
    if (order.items && order.items.length > 0) {
      order.items.forEach((item: any) => {
        totalWeight += (item.quantity || 0) * (item.product?.weight || 0);
        totalVolumes += (item.quantity || 0);
      });
    }
    
    return `
      <div style="max-width: 800px; margin: 0 auto; padding: 12px; font-family: Arial, sans-serif; font-size: 11px;">
        <!-- Company header - more compact -->
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 8px;">
          <div>
            <img src="/lovable-uploads/68daf61d-816f-4f86-8b3f-4f0970296cf0.png" width="150" height="60" style="object-fit: contain;" alt="Ferplas Logo">
          </div>
          <div style="text-align: right; font-size: 11px;">
            <p style="font-weight: bold; font-size: 14px; margin-bottom: 2px; margin-top: 0px;">${companyInfo.name || 'Ferplas Indústria e Comércio'}</p>
            <p style="margin: 2px 0;">CNPJ: ${companyInfo.document || '00.000.000/0000-00'} | IE: ${companyInfo.stateRegistration || '000.000.000.000'}</p>
            <p style="margin: 2px 0;">${companyInfo.address || 'Av. Principal, 1234'} - ${companyInfo.city || 'São Paulo'}/${companyInfo.state || 'SP'} - ${companyInfo.zipCode || '00000-000'}</p>
            <p style="margin: 2px 0;">Tel: ${companyInfo.phone || '(00) 0000-0000'} | ${companyInfo.email || 'contato@ferplas.com.br'}</p>
            ${companyInfo.website ? `<p style="margin: 2px 0;">${companyInfo.website}</p>` : ''}
          </div>
        </div>
        
        <!-- Order title -->
        <div style="text-align: center; margin-bottom: 8px;">
          <h1 style="font-size: 16px; font-weight: bold; border: 1px solid #ddd; display: inline-block; padding: 4px 12px; margin: 4px 0;">
            PEDIDO #${order.orderNumber || order.order_number || '1'}
          </h1>
          <p style="font-size: 10px; margin: 2px 0;">
            Emitido em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
        
        <!-- Customer and order info -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
          <div style="border: 1px solid #ddd; border-radius: 4px; padding: 8px;">
            <h2 style="font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin: 0 0 5px 0; font-size: 12px;">Cliente</h2>
            <p style="font-weight: 600; margin: 2px 0;">${order.customer?.companyName || order.customers?.company_name || 'Cliente não identificado'}</p>
            <p style="margin: 2px 0;">CNPJ/CPF: ${order.customer?.document || order.customers?.document || 'N/A'}</p>
            ${(order.customer?.stateRegistration || order.customers?.state_registration) ? 
              `<p style="margin: 2px 0;">IE: ${order.customer?.stateRegistration || order.customers?.state_registration}</p>` : ''}
            <p style="margin: 2px 0;">${order.customer?.street || order.customers?.street || ''}, ${order.customer?.number || order.customers?.number || ''} ${order.customer?.complement ? `- ${order.customer.complement}` : (order.customers?.complement ? `- ${order.customers.complement}` : '')}</p>
            ${(order.customer?.neighborhood || order.customers?.neighborhood) ? 
              `<p style="margin: 2px 0;">Bairro: ${order.customer?.neighborhood || order.customers?.neighborhood}</p>` : ''}
            <p style="margin: 2px 0;">${order.customer?.city || order.customers?.city || 'N/A'}/${order.customer?.state || order.customers?.state || 'N/A'} - ${order.customer?.zipCode || order.customers?.zip_code || 'N/A'}</p>
            <p style="margin: 2px 0;">Tel: ${order.customer?.phone || order.customers?.phone || 'N/A'}</p>
            ${(order.customer?.whatsapp || order.customers?.whatsapp) ? 
              `<p style="margin: 2px 0;">WhatsApp: ${order.customer?.whatsapp || order.customers?.whatsapp}</p>` : ''}
          </div>
          
          <div style="border: 1px solid #ddd; border-radius: 4px; padding: 8px;">
            <h2 style="font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin: 0 0 5px 0; font-size: 12px;">Dados do Pedido</h2>
            <p style="margin: 2px 0;"><span style="font-weight: 600;">Data:</span> ${format(new Date(order.createdAt || order.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
            <p style="margin: 2px 0;"><span style="font-weight: 600;">Vendedor:</span> ${order.user?.name || 'Não informado'}</p>
            <p style="margin: 2px 0;"><span style="font-weight: 600;">Status:</span> ${
              order.status === 'pending' ? 'Pendente' : 
              order.status === 'confirmed' ? 'Confirmado' : 
              order.status === 'invoiced' ? 'Faturado' : 
              order.status === 'completed' ? 'Concluído' : 'Cancelado'
            }</p>
            <p style="margin: 2px 0;"><span style="font-weight: 600;">Pagamento:</span> ${(order.paymentMethod || order.payment_method) === 'cash' ? 'À Vista' : 'A Prazo'}</p>
            ${(order.paymentMethod || order.payment_method) === 'credit' && (order.paymentTerms || order.payment_terms) ? 
              `<p style="margin: 2px 0;"><span style="font-weight: 600;">Prazos:</span> ${order.paymentTerms || order.payment_terms}</p>` : ''}
            <p style="margin: 2px 0;"><span style="font-weight: 600;">Tipo de Nota:</span> ${invoiceTypeText} ${halfInvoiceText}</p>
            <p style="margin: 2px 0;"><span style="font-weight: 600;">Substituição Tributária:</span> ${order.taxSubstitution || order.tax_substitution ? 'Sim' : 'Não'}</p>
            <p style="margin: 2px 0;"><span style="font-weight: 600;">IPI:</span> ${order.withIPI || order.with_ipi ? 'Sim' : 'Não'}</p>
          </div>
        </div>
        
        <!-- Order items -->
        <div style="margin-bottom: 8px;">
          <h2 style="font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin: 0 0 5px 0; font-size: 12px;">Itens do Pedido</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="border: 1px solid #ddd; padding: 3px; text-align: left;">Produto</th>
                <th style="border: 1px solid #ddd; padding: 3px; text-align: right;">Preço</th>
                <th style="border: 1px solid #ddd; padding: 3px; text-align: center;">Desc.</th>
                <th style="border: 1px solid #ddd; padding: 3px; text-align: right;">Final</th>
                <th style="border: 1px solid #ddd; padding: 3px; text-align: center;">Qtd.</th>
                <th style="border: 1px solid #ddd; padding: 3px; text-align: center;">Unid. Total</th>
                <th style="border: 1px solid #ddd; padding: 3px; text-align: center;">Peso Total</th>
                <th style="border: 1px solid #ddd; padding: 3px; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${(order.items || []).map((item: any, index: number) => {
                const totalUnits = (item.quantity || 0) * (item.product?.quantityPerVolume || 1);
                const totalWeight = (item.quantity || 0) * (item.product?.weight || 0);
                
                return `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 3px;">${item?.product?.name || item?.productName || `Produto ${index + 1}`}</td>
                  <td style="border: 1px solid #ddd; padding: 3px; text-align: right;">
                    ${formatCurrency(item?.listPrice || item?.product?.listPrice || 0)}
                  </td>
                  <td style="border: 1px solid #ddd; padding: 3px; text-align: center;">${item?.discount || 0}%</td>
                  <td style="border: 1px solid #ddd; padding: 3px; text-align: right;">${formatCurrency(item?.finalPrice || 0)}</td>
                  <td style="border: 1px solid #ddd; padding: 3px; text-align: center;">${item?.quantity || 0}</td>
                  <td style="border: 1px solid #ddd; padding: 3px; text-align: center;">${totalUnits}</td>
                  <td style="border: 1px solid #ddd; padding: 3px; text-align: center;">${totalWeight.toFixed(2)} kg</td>
                  <td style="border: 1px solid #ddd; padding: 3px; text-align: right;">${formatCurrency(item?.subtotal || 0)}</td>
                </tr>
              `}).join('')}
            </tbody>
          </table>
        </div>
        
        <!-- Two column layout for delivery and financial summary -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
          <!-- Delivery info -->
          <div>
            <h2 style="font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin: 0 0 5px 0; font-size: 12px;">Entrega</h2>
            <p style="margin: 2px 0;"><span style="font-weight: 600;">Tipo:</span> ${(order.shipping || order.shipping) === 'delivery' ? 'Entrega' : 'Retirada'}</p>
            ${(order.shipping || order.shipping) === 'delivery' && (order.deliveryLocation || order.delivery_location) ? 
              `<p style="margin: 2px 0;"><span style="font-weight: 600;">Região:</span> ${(order.deliveryLocation || order.delivery_location) === 'capital' ? 'Capital' : 'Interior'}</p>` : ''}
            ${(order.shipping || order.shipping) === 'delivery' && (order.deliveryFee || order.delivery_fee) && (order.deliveryFee || order.delivery_fee) > 0 ? 
              `<p style="margin: 2px 0;"><span style="font-weight: 600;">Taxa:</span> ${formatCurrency(order.deliveryFee || order.delivery_fee)}</p>` : ''}
            <p style="margin: 2px 0;"><span style="font-weight: 600;">Peso Total:</span> ${totalWeight.toFixed(2)} kg</p>
            <p style="margin: 2px 0;"><span style="font-weight: 600;">Total de Volumes:</span> ${totalVolumes}</p>
          </div>
          
          <!-- Financial summary -->
          <div>
            <h2 style="font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin: 0 0 5px 0; font-size: 12px;">Resumo Financeiro</h2>
            <table style="width: 100%;">
              <tr>
                <td style="padding: 2px 0;">Subtotal:</td>
                <td style="padding: 2px 0; text-align: right; font-weight: 500;">${formatCurrency(order.subtotal)}</td>
              </tr>
              <tr>
                <td style="padding: 2px 0;">Descontos:</td>
                <td style="padding: 2px 0; text-align: right; color: #dc2626; font-weight: 500;">
                  -${formatCurrency(order.totalDiscount || order.total_discount || 0)}
                </td>
              </tr>
              ${(order.taxSubstitution || order.tax_substitution) ? `
                <tr>
                  <td style="padding: 2px 0;">Substituição Tributária (7.8%):</td>
                  <td style="padding: 2px 0; text-align: right; color: #ea580c; font-weight: 500;">
                    +${formatCurrency(taxSubstitutionValue)}
                  </td>
                </tr>
              ` : ''}
              ${(order.withIPI || order.with_ipi) && ipiValue > 0 ? `
                <tr>
                  <td style="padding: 2px 0;">IPI:</td>
                  <td style="padding: 2px 0; text-align: right; color: #ea580c; font-weight: 500;">
                    +${formatCurrency(ipiValue)}
                  </td>
                </tr>
              ` : ''}
              ${(order.deliveryFee || order.delivery_fee) && (order.deliveryFee || order.delivery_fee) > 0 ? `
                <tr>
                  <td style="padding: 2px 0;">Taxa de Entrega:</td>
                  <td style="padding: 2px 0; text-align: right; font-weight: 500;">${formatCurrency(order.deliveryFee || order.delivery_fee)}</td>
                </tr>
              ` : ''}
              <tr style="border-top: 1px solid #ddd;">
                <td style="padding: 3px 0; font-weight: bold;">Total:</td>
                <td style="padding: 3px 0; text-align: right; font-weight: bold;">${formatCurrency(order.total)}</td>
              </tr>
            </table>
          </div>
        </div>
        
        ${(order.notes || order.observations) ? `
          <div style="margin-bottom: 8px;">
            <h2 style="font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin: 0 0 5px 0; font-size: 12px;">Observações</h2>
            <p style="border: 1px solid #ddd; padding: 4px; background-color: #f9f9f9; margin: 0;">${order.notes || order.observations}</p>
          </div>
        ` : ''}
        
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd; text-align: center; font-size: 10px; color: #666;">
          <p style="margin: 0;">Este documento não possui valor fiscal. Para mais informações entre em contato conosco.</p>
        </div>
      </div>
    `;
  };
