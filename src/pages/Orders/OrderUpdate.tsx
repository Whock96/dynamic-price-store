import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useOrders } from '@/context/OrderContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Download, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrderData } from '@/hooks/use-order-data';
import { supabase, uploadInvoicePdf, deleteInvoicePdf } from '@/integrations/supabase/client';
import { User, TransportCompany, Order } from '@/types/types';
import { FileUpload } from '@/components/ui/file-upload';
import DuplicataForm from "@/components/orders/DuplicataForm";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchRefTable, fetchDuplicatas, upsertDuplicata, deleteDuplicata, uploadBoletoPdf, deleteBoletoPdf } from "@/integrations/supabase/duplicata";
import { Duplicata, RefTable } from "@/types/duplicata";

const OrderUpdate = () => {
  const { id } = useParams<{ id: string }>();
  const { updateOrder, updateOrderStatus } = useOrders();
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [shipping, setShipping] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit'>('cash');
  const [paymentTerms, setPaymentTerms] = useState<string>('');
  const [salespeople, setSalespeople] = useState<User[]>([]);
  const [selectedSalespersonId, setSelectedSalespersonId] = useState<string>('none');
  const [isLoadingSalespeople, setIsLoadingSalespeople] = useState(true);
  const [transportCompanies, setTransportCompanies] = useState<TransportCompany[]>([]);
  const [selectedTransportCompanyId, setSelectedTransportCompanyId] = useState<string>('none');
  const [isLoadingTransportCompanies, setIsLoadingTransportCompanies] = useState(true);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [invoicePdf, setInvoicePdf] = useState<File | null>(null);
  const [invoicePdfPath, setInvoicePdfPath] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingPdf, setIsDeletingPdf] = useState(false);
  const [duplicatas, setDuplicatas] = useState<Duplicata[]>([]);
  const [isLoadingDuplicatas, setIsLoadingDuplicatas] = useState(true);
  const [showDuplicataForm, setShowDuplicataForm] = useState(false);
  const [editingDuplicata, setEditingDuplicata] = useState<Duplicata | null>(null);
  const [isSavingDuplicata, setIsSavingDuplicata] = useState(false);
  const [isLoadingLookup, setIsLoadingLookup] = useState(true);
  const [lookup, setLookup] = useState<{
    modos: RefTable[];
    portadores: RefTable[];
    bancos: RefTable[];
    statuses: RefTable[];
  }>({
    modos: [],
    portadores: [],
    bancos: [],
    statuses: []
  });

  const { order, isLoading, fetchOrderData } = useOrderData(id);

  useEffect(() => {
    const fetchSalespeople = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, name, username, user_type_id');
          
        if (error) throw error;
        
        if (data) {
          const mappedSalespeople: User[] = data.map(sp => ({
            id: sp.id,
            name: sp.name,
            username: sp.username,
            role: 'salesperson',
            permissions: [],
            email: '',
            createdAt: new Date(),
            userTypeId: sp.user_type_id || ''
          }));
          
          setSalespeople(mappedSalespeople);
        }
      } catch (error) {
        console.error('Error fetching salespeople:', error);
        toast.error('Erro ao carregar vendedores');
      } finally {
        setIsLoadingSalespeople(false);
      }
    };
    
    fetchSalespeople();
  }, []);

  useEffect(() => {
    const fetchTransportCompanies = async () => {
      try {
        const { data, error } = await supabase
          .from('transport_companies')
          .select('*');
          
        if (error) throw error;
        
        if (data) {
          setTransportCompanies(data as TransportCompany[]);
        }
      } catch (error) {
        console.error('Error fetching transport companies:', error);
        toast.error('Erro ao carregar transportadoras');
      } finally {
        setIsLoadingTransportCompanies(false);
      }
    };
    
    fetchTransportCompanies();
  }, []);

  useEffect(() => {
    if (order) {
      setStatus(order.status || 'pending');
      setNotes(order.notes || order.observations || '');
      setShipping((order.shipping || 'delivery') as 'delivery' | 'pickup');
      setPaymentMethod((order.paymentMethod || 'cash') as 'cash' | 'credit');
      setPaymentTerms(order.paymentTerms || '');
      setSelectedSalespersonId(order.userId || 'none');
      setSelectedTransportCompanyId(order.transportCompanyId ? order.transportCompanyId : 'none');
      setInvoiceNumber(order.invoiceNumber || '');
      setInvoicePdfPath(order.invoicePdfPath || null);
    }
  }, [order]);

  useEffect(() => {
    async function loadLookups() {
      setIsLoadingLookup(true);
      try {
        const [modos, portadores, bancos, statuses] = await Promise.all([
          fetchRefTable("modo_pagamento"),
          fetchRefTable("portador"),
          fetchRefTable("bancos"),
          fetchRefTable("payment_status"),
        ]);
        setLookup({ modos, portadores, bancos, statuses });
      } catch (err) {
        toast.error("Erro ao carregar opções para duplicatas");
      } finally {
        setIsLoadingLookup(false);
      }
    }
    loadLookups();
  }, []);

  useEffect(() => {
    if (id) {
      setIsLoadingDuplicatas(true);
      fetchDuplicatas(id)
        .then(setDuplicatas)
        .catch((e) => toast.error("Erro ao buscar duplicatas"))
        .finally(() => setIsLoadingDuplicatas(false));
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!order || !id) return;
    
    const updates: Partial<Order> = {};

    if (status !== order.status) {
      updateOrderStatus(id, status as any);
    }

    if (notes !== order.notes) updates.notes = notes;
    if (shipping !== order.shipping) updates.shipping = shipping;
    if (paymentMethod !== order.paymentMethod) updates.paymentMethod = paymentMethod;
    if (paymentTerms !== order.paymentTerms) updates.paymentTerms = paymentTerms;
    if (selectedSalespersonId !== order.userId) {
      updates.userId = selectedSalespersonId === 'none' ? null : selectedSalespersonId;
    }
    if (selectedTransportCompanyId !== order.transportCompanyId) {
      updates.transportCompanyId = selectedTransportCompanyId === 'none' ? null : selectedTransportCompanyId;
    }
    if (invoiceNumber !== (order.invoiceNumber || '')) {
      updates.invoiceNumber = invoiceNumber.trim() || null;
    }

    if (invoicePdf) {
      setIsUploading(true);
      try {
        console.log('Attempting to upload PDF file:', invoicePdf.name);
        const publicUrl = await uploadInvoicePdf(invoicePdf, id);
        console.log('Upload successful, received URL:', publicUrl);
        
        if (!publicUrl) {
          throw new Error('Falha ao fazer upload do arquivo');
        }
        
        updates.invoicePdfPath = publicUrl;
      } catch (error: any) {
        console.error('Error uploading PDF:', error);
        let errorMessage = error.message || 'Erro desconhecido';
        toast.error(`Erro ao fazer upload do arquivo: ${errorMessage}`);
        setIsUploading(false);
        return;
      }
    }

    if (Object.keys(updates).length > 0) {
      try {
        await updateOrder(id, updates);
        toast.success('Pedido atualizado com sucesso');
        navigate(`/orders/${id}`);
      } catch (error: any) {
        console.error('Error updating order:', error);
        toast.error(`Erro ao atualizar pedido: ${error.message || 'Erro desconhecido'}`);
      }
    } else {
      toast.info('Nenhuma alteração foi feita');
      navigate(`/orders/${id}`);
    }
  };

  const handlePdfDelete = async () => {
    if (!id || !invoicePdfPath) return;
    
    setIsDeletingPdf(true);
    try {
      const deleteSuccess = await deleteInvoicePdf(invoicePdfPath);
      
      if (!deleteSuccess) {
        throw new Error('Falha ao excluir o arquivo PDF');
      }
      
      await updateOrder(id, { invoicePdfPath: null });
      
      setInvoicePdfPath(null);
      setInvoicePdf(null);
      
      toast.success('Arquivo PDF excluído com sucesso');
      
      if (fetchOrderData) {
        await fetchOrderData();
      }
    } catch (error: any) {
      console.error('Error deleting PDF:', error);
      toast.error(`Erro ao excluir o arquivo: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsDeletingPdf(false);
    }
  };

  const handleShippingChange = (value: string) => {
    if (value === 'delivery' || value === 'pickup') {
      setShipping(value);
    }
  };

  const handlePaymentMethodChange = (value: string) => {
    if (value === 'cash' || value === 'credit') {
      setPaymentMethod(value);
    }
  };

  const handleCreateDuplicata = () => {
    setEditingDuplicata(null);
    setShowDuplicataForm(true);
  };

  const handleEditDuplicata = (dup: Duplicata) => {
    setEditingDuplicata(dup);
    setShowDuplicataForm(true);
  };

  const handleSaveDuplicata = async (form: Partial<Duplicata>, file?: File | null) => {
    setIsSavingDuplicata(true);
    let pdfBoletoPath = form.pdfBoletoPath || null;
    try {
      if (file && id) {
        pdfBoletoPath = await uploadBoletoPdf(file, id);
      }
      const payload: Partial<Duplicata> = {
        ...form,
        orderId: id,
        pdfBoletoPath,
      };
      if (form.id) payload.id = form.id;
      const res = await upsertDuplicata(payload);
      toast.success("Duplicata salva");
      setShowDuplicataForm(false);
      setEditingDuplicata(null);
      fetchDuplicatas(id).then(setDuplicatas);
    } catch (err: any) {
      toast.error("Erro ao salvar duplicata: " + (err.message || "Erro desconhecido"));
    } finally {
      setIsSavingDuplicata(false);
    }
  };

  const handleDeleteDuplicata = async (dup: Duplicata) => {
    if (!window.confirm("Excluir esta duplicata?")) return;
    try {
      if (dup.pdfBoletoPath) {
        await deleteBoletoPdf(dup.pdfBoletoPath);
      }
      await deleteDuplicata(dup.id);
      toast.success("Duplicata excluída");
      fetchDuplicatas(id).then(setDuplicatas);
    } catch (err: any) {
      toast.error("Erro ao excluir duplicata");
    }
  };

  const handleDeleteBoletoPdf = async (dup: Duplicata) => {
    if (!dup.pdfBoletoPath) return;
    if (!window.confirm("Excluir o PDF do boleto?")) return;
    try {
      await deleteBoletoPdf(dup.pdfBoletoPath);
      await upsertDuplicata({ id: dup.id, pdfBoletoPath: null });
      fetchDuplicatas(id).then(setDuplicatas);
      toast.success("PDF excluído");
    } catch (err) {
      toast.error("Erro ao excluir PDF");
    }
  };

  if (isLoading || isLoadingSalespeople || isLoadingTransportCompanies) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-2xl font-bold mb-2">Pedido não encontrado</h2>
        <p className="text-muted-foreground mb-6">O pedido solicitado não foi encontrado.</p>
        <Button onClick={() => navigate('/orders')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para lista de pedidos
        </Button>
      </div>
    );
  }

  const orderNumber = order.orderNumber || id?.split('-')[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate('/orders')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Editar Pedido #{orderNumber}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/orders/${id}`}>
            <Button variant="outline">Cancelar</Button>
          </Link>
          <Button 
            onClick={handleSubmit} 
            className="bg-ferplas-500 hover:bg-ferplas-600"
            disabled={isUploading || isDeletingPdf}
          >
            <Save className="mr-2 h-4 w-4" />
            {isUploading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Informações do Pedido</span>
            <OrderStatusBadge status={status as any} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Detalhes</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Cliente</label>
                  <div className="mt-1 border rounded-md p-3 bg-gray-50">
                    {order.customer?.companyName || "Cliente não encontrado"}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Data</label>
                  <div className="mt-1 border rounded-md p-3 bg-gray-50">
                    {formatDate(order.createdAt)}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Vendedor</label>
                  <Select 
                    value={selectedSalespersonId} 
                    onValueChange={setSelectedSalespersonId}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Selecione um vendedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {salespeople.map((sp) => (
                        <SelectItem key={sp.id} value={sp.id}>
                          {sp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Transportadora</label>
                  <Select 
                    value={selectedTransportCompanyId} 
                    onValueChange={setSelectedTransportCompanyId}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Selecione uma transportadora" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      {transportCompanies.map((tc) => (
                        <SelectItem key={tc.id} value={tc.id}>
                          {tc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="invoiced">Faturado</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="canceled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Forma de Entrega</label>
                  <Select value={shipping} onValueChange={handleShippingChange}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Selecione a forma de entrega" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="delivery">Entrega</SelectItem>
                      <SelectItem value="pickup">Retirada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Forma de Pagamento</label>
                  <Select value={paymentMethod} onValueChange={handlePaymentMethodChange}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Selecione a forma de pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">À Vista</SelectItem>
                      <SelectItem value="credit">A Prazo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {paymentMethod === 'credit' && (
                  <div>
                    <label className="text-sm font-medium">Condições de Pagamento</label>
                    <Input
                      className="mt-1"
                      placeholder="Ex: 30/60/90 dias"
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium">Observações</label>
                  <Textarea 
                    className="mt-1" 
                    placeholder="Observações sobre o pedido"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Resumo do Pedido</h3>
              <div className="border rounded-md overflow-hidden">
                <div className="bg-gray-50 p-4">
                  <h4 className="font-medium">Itens</h4>
                </div>
                <div className="p-4 space-y-3">
                  {order.items && order.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between">
                      <div>
                        <div className="font-medium">
                          {item.product?.name || "Produto não encontrado"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.quantity} x {formatCurrency(item.finalPrice)}
                        </div>
                      </div>
                      <div className="font-medium">{formatCurrency(item.subtotal)}</div>
                    </div>
                  ))}
                </div>
                <div className="border-t p-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-700">Subtotal</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-700">Desconto total</span>
                    <span>- {formatCurrency(order.totalDiscount)}</span>
                  </div>
                  {order.deliveryFee > 0 && (
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-700">Taxa de entrega</span>
                      <span>{formatCurrency(order.deliveryFee)}</span>
                    </div>
                  )}
                  {order.taxSubstitution && (
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-700">Substituição Tributária</span>
                      <span>+ {formatCurrency((7.8 / 100) * order.subtotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold mt-4 pt-4 border-t">
                    <span>Total</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Duplicatas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingLookup || isLoadingDuplicatas ? (
            <div className="py-4 text-sm text-muted-foreground">Carregando...</div>
          ) : (
            <>
              <div className="mb-4 flex gap-2">
                <Button onClick={handleCreateDuplicata} size="sm">
                  Adicionar Duplicata
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Emissão</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Acresc.</TableHead>
                      <TableHead>Desconto</TableHead>
                      <TableHead>Modo Pgto.</TableHead>
                      <TableHead>Portador</TableHead>
                      <TableHead>Banco</TableHead>
                      <TableHead>Situação</TableHead>
                      <TableHead>Valor Recebido</TableHead>
                      <TableHead>Data Pgto</TableHead>
                      <TableHead>Banco Pgto</TableHead>
                      <TableHead>Boleto PDF</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {duplicatas.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>{d.numeroDuplicata}</TableCell>
                        <TableCell>{d.dataEmissao ? format(new Date(d.dataEmissao), "dd/MM/yyyy", { locale: ptBR }) : '-'}</TableCell>
                        <TableCell>{d.dataVencimento ? format(new Date(d.dataVencimento), "dd/MM/yyyy", { locale: ptBR }) : '-'}</TableCell>
                        <TableCell>{formatCurrency(d.valor)}</TableCell>
                        <TableCell>{formatCurrency(d.valorAcrescimo)}</TableCell>
                        <TableCell>{formatCurrency(d.valorDesconto)}</TableCell>
                        <TableCell>{d.modoPagamento?.nome || '-'}</TableCell>
                        <TableCell>{d.portador?.nome || '-'}</TableCell>
                        <TableCell>{d.banco?.nome || '-'}</TableCell>
                        <TableCell>{d.paymentStatus?.nome || '-'}</TableCell>
                        <TableCell>{d.valorRecebido !== undefined ? formatCurrency(d.valorRecebido) : '-'}</TableCell>
                        <TableCell>{d.dataPagamento ? format(new Date(d.dataPagamento), "dd/MM/yyyy", { locale: ptBR }) : '-'}</TableCell>
                        <TableCell>{d.bancoPagamento?.nome || '-'}</TableCell>
                        <TableCell>
                          {d.pdfBoletoPath ? (
                            <a href={d.pdfBoletoPath} target="_blank" rel="noopener noreferrer">
                              <Button size="icon" variant="ghost" className="hover:bg-ferplas-50" title="Baixar PDF">
                                <Download size={18} />
                              </Button>
                            </a>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                          {d.pdfBoletoPath && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteBoletoPdf(d)}
                              title="Excluir PDF"
                            >
                              <Trash2 size={16} />
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => handleEditDuplicata(d)}>
                            Editar
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteDuplicata(d)}
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {duplicatas.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={15} className="text-center py-8 text-muted-foreground">
                          Nenhuma duplicata cadastrada.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {showDuplicataForm && (
                <div className="fixed inset-0 bg-black/20 z-30 flex justify-center items-center">
                  <div className="bg-white rounded-md p-4 max-w-lg w-full">
                    <DuplicataForm
                      value={editingDuplicata as Duplicata}
                      lookup={lookup}
                      isSaving={isSavingDuplicata}
                      onSave={handleSaveDuplicata}
                      onCancel={() => {
                        setShowDuplicataForm(false);
                        setEditingDuplicata(null);
                      }}
                      onDeletePdf={
                        editingDuplicata?.pdfBoletoPath
                          ? async () => handleDeleteBoletoPdf(editingDuplicata!)
                          : undefined
                      }
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações de Faturamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="invoiceNumber">Número da Nota Fiscal</Label>
              <Input
                id="invoiceNumber"
                className="mt-1"
                placeholder="Informe o número da NFe"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                disabled={isUploading || isDeletingPdf}
              />
            </div>
            
            <div>
              <Label>Arquivo PDF da NFe</Label>
              <FileUpload
                onChange={(file) => {
                  console.log('File selected:', file?.name);
                  setInvoicePdf(file);
                }}
                value={invoicePdfPath}
                accept="application/pdf,.pdf"
                maxSize={10}
                isLoading={isUploading || isDeletingPdf}
                onDelete={invoicePdfPath ? handlePdfDelete : undefined}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Formatos aceitos: PDF. Tamanho máximo: 10MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderUpdate;
