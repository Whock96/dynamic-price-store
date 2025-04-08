import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Trash2, ShoppingCart, Package, Search, Send, MapPin, Percent, Tags, Truck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { useCart } from '../../context/CartContext';
import { useCustomers } from '../../context/CustomerContext';
import { useDiscountSettings } from '@/hooks/use-discount-settings';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/client';
import { supabaseProductToAppProduct } from '@/utils/adapters';
import { useAuth } from '@/context/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from '@/utils/formatters';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

type SupabaseProduct = Tables<'products'>;
type TransportCompany = {
  id: string;
  name: string;
  document: string;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  created_at: string;
  updated_at: string;
};

const Cart = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { customers } = useCustomers();
  const { settings } = useDiscountSettings();
  const { user } = useAuth();
  const searchParams = new URLSearchParams(location.search);
  const productParam = searchParams.get('product');
  const customerParam = searchParams.get('customer');
  
  const { 
    items, customer, setCustomer, addItem, removeItem, updateItemQuantity,
    updateItemDiscount, discountOptions, toggleDiscountOption, isDiscountOptionSelected,
    deliveryLocation, setDeliveryLocation, halfInvoicePercentage, setHalfInvoicePercentage,
    halfInvoiceType, setHalfInvoiceType,
    observations, setObservations, totalItems, subtotal, totalDiscount, total, sendOrder, clearCart, 
    deliveryFee, applyDiscounts, toggleApplyDiscounts, paymentTerms, setPaymentTerms,
    calculateTaxSubstitutionValue, withIPI, toggleIPI, calculateIPIValue, calculateItemTaxSubstitutionValue
  } = useCart();
  
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [products, setProducts] = useState<SupabaseProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [transportCompanies, setTransportCompanies] = useState<TransportCompany[]>([]);
  const [selectedTransportCompany, setSelectedTransportCompany] = useState<string | undefined>(undefined);
  const [isLoadingTransportCompanies, setIsLoadingTransportCompanies] = useState(true);
  
  const isSalesperson = user?.userTypeId === 'c5ee0433-3faf-46a4-a516-be7261bfe575';
  
  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const { data, error } = await supabase
        .from('products')
        .select('*');
      
      if (error) {
        console.error('Error fetching products:', error);
        toast.error('Erro ao carregar produtos');
        return;
      }
      
      if (data) {
        console.log("Produtos carregados:", data);
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setIsLoadingProducts(false);
    }
  };
  
  const fetchTransportCompanies = async () => {
    try {
      setIsLoadingTransportCompanies(true);
      const { data, error } = await supabase
        .from('transport_companies')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error fetching transport companies:', error);
        toast.error('Erro ao carregar transportadoras');
        return;
      }
      
      if (data) {
        console.log("Transportadoras carregadas:", data);
        setTransportCompanies(data as TransportCompany[]);
      }
    } catch (error) {
      console.error('Error fetching transport companies:', error);
      toast.error('Erro ao carregar transportadoras');
    } finally {
      setIsLoadingTransportCompanies(false);
    }
  };
  
  useEffect(() => {
    fetchProducts();
    fetchTransportCompanies();
  }, []);
  
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.companyName.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.document.includes(customerSearch);
    
    if (isSalesperson) {
      return matchesSearch && c.salesPersonId === user?.id;
    }
    
    return matchesSearch;
  });
  
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(productSearch.toLowerCase()))
  );
  
  useEffect(() => {
    if (customerParam && !customer) {
      const selectedCustomer = customers.find(c => c.id === customerParam);
      if (selectedCustomer) {
        setCustomer(selectedCustomer);
        toast.success(`Cliente "${selectedCustomer.companyName}" selecionado`);
      }
    }
    
    if (productParam) {
      const loadProduct = async () => {
        try {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', productParam)
            .single();
          
          if (error) {
            console.error('Error fetching product:', error);
            return;
          }
          
          if (data) {
            console.log("Produto para adicionar:", data);
            const appProduct = supabaseProductToAppProduct(data);
            console.log("Produto convertido:", appProduct);
            addItem(appProduct, 1);
            navigate('/cart', { replace: true });
          }
        } catch (error) {
          console.error('Error loading product:', error);
        }
      };
      
      loadProduct();
    }
  }, [customerParam, productParam, customer, addItem, navigate, setCustomer, customers]);
  
  useEffect(() => {
    if (customer && customer.transportCompanyId) {
      console.log('Setting transport company from customer:', customer.transportCompanyId);
      setSelectedTransportCompany(customer.transportCompanyId === 'none' ? undefined : customer.transportCompanyId);
    } else {
      setSelectedTransportCompany(undefined);
    }
  }, [customer]);
  
  const handleSubmitOrder = async () => {
    if (!customer) {
      toast.error('Selecione um cliente para continuar');
      return;
    }
    
    if (items.length === 0) {
      toast.error('Adicione produtos ao carrinho para continuar');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await sendOrder();
      navigate('/orders');
    } catch (error) {
      console.error('Error submitting order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const taxSubstitutionValue = calculateTaxSubstitutionValue();
  const ipiValue = calculateIPIValue();
  
  const getTaxSubstitutionRate = () => {
    if (!isDiscountOptionSelected('3') || !applyDiscounts) return 0;
    
    const taxOption = discountOptions.find(opt => opt.id === '3');
    if (!taxOption) return 0;
    
    if (isDiscountOptionSelected('2')) {
      return taxOption.value * halfInvoicePercentage / 100;
    }
    
    return taxOption.value;
  };
  
  const effectiveTaxRate = getTaxSubstitutionRate();
  
  const getIPIRate = () => {
    if (!withIPI || !applyDiscounts) return 0;
    
    const ipiRate = settings ? settings.ipiRate : 10;
    
    if (isDiscountOptionSelected('2')) {
      return ipiRate * halfInvoicePercentage / 100;
    }
    
    return ipiRate;
  };
  
  const effectiveIPIRate = getIPIRate();
  
  const handleAddProduct = (p: SupabaseProduct) => {
    try {
      console.log("Produto antes da conversão:", p);
      const appProduct = supabaseProductToAppProduct(p);
      console.log("Produto após conversão:", appProduct);
      addItem(appProduct, 1);
      toast.success(`${p.name} adicionado ao carrinho`);
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
      toast.error(`Erro ao adicionar ${p.name} ao carrinho`);
    }
  };

  const calculateTotalUnits = (item) => {
    const quantityPerVolume = item.product.quantityPerVolume || 1;
    return item.quantity * quantityPerVolume;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-4 text-gray-500"
            onClick={() => navigate(-1)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Carrinho</h1>
            <p className="text-muted-foreground">
              Monte seu pedido e selecione as opções de desconto
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Limpar carrinho?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação irá remover todos os produtos e configurações do carrinho. Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => clearCart()}
                >
                  Limpar Carrinho
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button 
            className="bg-ferplas-500 hover:bg-ferplas-600 button-transition"
            onClick={handleSubmitOrder}
            disabled={isSubmitting || items.length === 0 || !customer}
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Finalizar Pedido
              </>
            )}
          </Button>
        </div>
      </header>

      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex justify-between items-center">
              <span>Cliente</span>
              <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="ml-2 text-ferplas-500 hover:bg-ferplas-50"
                  >
                    <Search className="h-4 w-4 mr-1" />
                    {customer ? 'Trocar' : 'Selecionar'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px]">
                  <DialogHeader>
                    <DialogTitle>Selecionar Cliente</DialogTitle>
                    <DialogDescription>
                      {isSalesperson 
                        ? "Escolha um dos seus clientes para este pedido ou adicione um novo."
                        : "Escolha um cliente para este pedido ou adicione um novo."}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="flex items-center space-x-2 my-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Buscar clientes por nome ou documento..."
                        className="pl-10 input-transition"
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      className="text-ferplas-500 hover:bg-ferplas-50"
                      onClick={() => {
                        setCustomerDialogOpen(false);
                        navigate('/customers/new');
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6"/><path d="M16 11h6"/></svg>
                      Novo
                    </Button>
                  </div>
                  
                  {filteredCustomers.length > 0 ? (
                    <ScrollArea className="h-[400px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Razão Social</TableHead>
                            <TableHead>CNPJ/CPF</TableHead>
                            <TableHead>Cidade/UF</TableHead>
                            <TableHead>Desconto</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCustomers.map(c => (
                            <TableRow 
                              key={c.id}
                              className="cursor-pointer hover:bg-gray-50"
                              onClick={() => {
                                setCustomer(c);
                                setCustomerDialogOpen(false);
                                toast.success(`Cliente "${c.companyName}" selecionado`);
                              }}
                            >
                              <TableCell className="font-medium">{c.companyName}</TableCell>
                              <TableCell>{c.document}</TableCell>
                              <TableCell>{c.city}/{c.state}</TableCell>
                              <TableCell>{c.defaultDiscount}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">
                        {isSalesperson 
                          ? "Nenhum cliente encontrado. Altere sua busca ou adicione um novo cliente atribuído a você."
                          : "Nenhum cliente encontrado. Altere sua busca ou adicione um novo cliente."}
                      </p>
                    </div>
                  )}
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setCustomerDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customer ? (
              <div className="space-y-3">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium text-lg text-ferplas-600">{customer.companyName}</h3>
                  <p className="text-sm text-gray-500">CNPJ/CPF: {customer.document}</p>
                  <p className="text-sm text-gray-500">
                    {customer.street}, {customer.number} {customer.complement && `- ${customer.complement}`}
                  </p>
                  <p className="text-sm text-gray-500">
                    {customer.city}/{customer.state} - {customer.zipCode}
                  </p>
                  <p className="text-sm text-gray-500">
                    {customer.phone} | {customer.email}
                  </p>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-sm font-medium">
                      Desconto padrão: <span className="text-ferplas-600">{customer.defaultDiscount}%</span>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-32 flex flex-col items-center justify-center text-center border rounded-md border-dashed p-4">
                <ShoppingCart className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-gray-500">Selecione um cliente para continuar</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex justify-between items-center">
              <span>Produtos no Carrinho {totalItems > 0 && `(${totalItems})`}</span>
              <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="ml-2 text-ferplas-500 hover:bg-ferplas-50"
                  >
                    <Package className="h-4 w-4 mr-1" />
                    Adicionar Produto
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Adicionar Produtos</DialogTitle>
                    <DialogDescription>
                      Busque e adicione produtos ao carrinho.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="flex items-center space-x-2 my-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Buscar produtos por nome ou descrição..."
                        className="pl-10 input-transition"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  {isLoadingProducts ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="w-10 h-10 border-4 border-ferplas-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : filteredProducts.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead>Preço</TableHead>
                            <TableHead>Qtd. Estoque</TableHead>
                            <TableHead className="text-right">Ação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredProducts.map(p => (
                            <TableRow key={p.id}>
                              <TableCell>
                                <div className="font-medium">{p.name}</div>
                                <div className="text-sm text-gray-500">{p.description ? p.description.substring(0, 30) + (p.description.length > 30 ? '...' : '') : ''}</div>
                              </TableCell>
                              <TableCell>{formatCurrency(Number(p.list_price) || 0)}</TableCell>
                              <TableCell>{p.quantity || 0} unidades</TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="h-8 px-2 text-ferplas-500"
                                  onClick={() => handleAddProduct(p)}
                                >
                                  Adicionar
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">Nenhum produto encontrado. Altere sua busca.</p>
                    </div>
                  )}
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setProductDialogOpen(false)}
                    >
                      Concluir
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {items.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Preço Unitário</TableHead>
                      <TableHead>Desconto (%)</TableHead>
                      <TableHead>Preço Final</TableHead>
                      <TableHead>Substituição Tributária</TableHead>
                      <TableHead>Quantidade Volumes</TableHead>
                      <TableHead>Total de Unidades</TableHead>
                      <TableHead>Subtotal</TableHead>
                      <TableHead className="w-14"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map(item => {
                      const totalUnits = calculateTotalUnits(item);
                      const taxValue = isDiscountOptionSelected('3') && applyDiscounts ? 
                        calculateItemTaxSubstitutionValue(item) : 0;
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.product.name}</TableCell>
                          <TableCell>{formatCurrency(item.product.listPrice)}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={item.discount}
                              onChange={(e) => updateItemDiscount(item.id, Number(e.target.value))}
                              className="w-20 h-8 text-center"
                            />
                          </TableCell>
                          <TableCell>{formatCurrency(item.finalPrice)}</TableCell>
                          <TableCell>
                            {isDiscountOptionSelected('3') && applyDiscounts ? 
                              formatCurrency(taxValue) : 
                              formatCurrency(0)
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                                className="h-8 w-8"
                                disabled={item.quantity <= 1}
                              >
                                -
                              </Button>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItemQuantity(item.id, Number(e.target.value) || 1)}
                                className="w-14 h-8 mx-1 text-center"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                                className="h-8 w-8"
                              >
                                +
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            {totalUnits}
                            {item.product.quantityPerVolume > 1 && (
                              <span className="text-xs text-gray-500 block">
                                ({item.product.quantityPerVolume} un/vol)
                              </span>
                            )}
                          </TableCell>
                          <TableCell>{formatCurrency(item.subtotal)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.id)}
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center border rounded-md border-dashed p-4">
                <ShoppingCart className="h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-lg font-medium text-gray-600 mb-1">Seu carrinho está vazio</h3>
                <p className="text-gray-500 mb-4">Adicione produtos ao seu carrinho para continuar</p>
                <Button 
                  variant="outline" 
                  className="text-ferplas-500 hover:bg-ferplas-50"
                  onClick={() => setProductDialogOpen(true)}
                >
                  <Package className="h-4 w-4 mr-1" />
                  Adicionar Produtos
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex justify-between items-center">
              <span>Opções de Desconto</span>
              <div className="flex items-center space-x-2">
                <Label htmlFor="apply-discounts" className={`text-sm ${applyDiscounts ? 'text-ferplas-600' : 'text-gray-500'}`}>
                  {applyDiscounts ? 'Descontos Ativos' : 'Descontos Inativos'}
                </Label>
                <Switch
                  id="apply-discounts"
                  checked={applyDiscounts}
                  onCheckedChange={toggleApplyDiscounts}
                />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {discountOptions.length > 0 ? (
                <>
                  {/* Opção de Retirada */}
                  {discountOptions.filter(option => option.id === '1').map(option => (
                    <div key={option.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {option.name} {applyDiscounts && (
                              <span className={option.type === 'discount' ? 'text-green-600' : 'text-red-600'}>
                                {option.type === 'discount' ? '(-' : '(+'}{option.value}%)
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-500">{option.description}</p>
                        </div>
                        <Switch
                          checked={isDiscountOptionSelected(option.id)}
                          onCheckedChange={() => toggleDiscountOption(option.id)}
                        />
                      </div>
                      
                      {option.id === '1' && !isDiscountOptionSelected(option.id) && (
                        <div className="ml-6 p-3 border-l-2 border-ferplas-100 bg-gray-50 rounded-md space-y-4">
                          <div className="flex items-center mb-1">
                            <MapPin className="h-4 w-4 text-ferplas-500 mr-1" />
                            <span className="text-sm font-medium text-gray-700">Local de entrega:</span>
                          </div>
                          <RadioGroup 
                            value={deliveryLocation || ''} 
                            onValueChange={(value) => setDeliveryLocation(value as 'capital' | 'interior')}
                            className="flex space-x-4 mt-1"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="capital" id="capital" />
                              <Label htmlFor="capital" className="text-sm">Capital</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="interior" id="interior" />
                              <Label htmlFor="interior" className="text-sm">Interior</Label>
                            </div>
                          </RadioGroup>
                          
                          <div className="pt-3 border-t border-gray-200 mt-3">
                            <div className="flex items-center mb-2">
                              <Truck className="h-4 w-4 text-ferplas-500 mr-1" />
                              <span className="text-sm font-medium text-gray-700">Transportadora:</span>
                            </div>
                            
                            <Select
                              value={selectedTransportCompany || "none"}
                              onValueChange={(value) => setSelectedTransportCompany(value === "none" ? undefined : value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecione uma transportadora" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Nenhuma</SelectItem>
                                {transportCompanies.map((company) => (
                                  <SelectItem key={company.id} value={company.id}>
                                    {company.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">
                              Selecione a transportadora responsável pela entrega
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Opção A Vista */}
                  {discountOptions.filter(option => option.id === '4').map(option => (
                    <div key={option.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {option.name} {applyDiscounts && (
                              <span className={option.type === 'discount' ? 'text-green-600' : 'text-red-600'}>
                                {option.type === 'discount' ? '(-' : '(+'}{option.value}%)
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-500">{option.description}</p>
                        </div>
                        <Switch
                          checked={isDiscountOptionSelected(option.id)}
                          onCheckedChange={() => toggleDiscountOption(option.id)}
                        />
                      </div>

                      {option.id === '4' && !isDiscountOptionSelected(option.id) && (
                        <div className="ml-6 p-3 border-l-2 border-ferplas-100 bg-gray-50 rounded-md">
                          <div className="flex items-center mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-ferplas-500 mr-1"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                            <span className="text-sm font-medium text-gray-700">Prazo de pagamento:</span>
                          </div>
                          <Input
                            type="text"
                            placeholder="Ex: 30/60/90 ou 28 DDL"
                            value={paymentTerms}
                            onChange={(e) => setPaymentTerms(e.target.value)}
                            className="w-full"
                          />
                          <p className="text-xs text-gray-500 mt-1">Informe o prazo de pagamento combinado com o cliente</p>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Opção Meia Nota */}
                  {discountOptions.filter(option => option.id === '2').map(option => (
                    <div key={option.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {option.name} {applyDiscounts && (
                              <span className={option.type === 'discount' ? 'text-green-600' : 'text-red-600'}>
                                {option.type === 'discount' ? '(-' : '(+'}{option.value}%)
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-500">{option.description}</p>
                        </div>
                        <Switch
                          checked={isDiscountOptionSelected(option.id)}
                          onCheckedChange={() => toggleDiscountOption(option.id)}
                        />
                      </div>
                      
                      {option.id === '2' && isDiscountOptionSelected(option.id) && (
                        <div className="ml-6 p-3 border-l-2 border-ferplas-100 bg-gray-50 rounded-md space-y-4">
                          <div className="flex items-center mb-2">
                            <Percent className="h-4 w-4 text-ferplas-500 mr-1" />
                            <span className="text-sm font-medium text-gray-700">Percentual da nota: {halfInvoicePercentage}%</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Slider
                              value={[halfInvoicePercentage]}
                              min={0}
                              max={100}
                              step={1}
                              onValueChange={(value) => setHalfInvoicePercentage(value[0])}
                              className="w-full"
                            />
                            <Input
                              type="number"
                              value={halfInvoicePercentage}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (val >= 0 && val <= 100) {
                                  setHalfInvoicePercentage(val);
                                }
                              }}
                              className="w-20"
                              min={0}
                              max={100}
                            />
                          </div>
                          
                          <div className="flex flex-col space-y-2">
                            <label className="text-sm font-medium text-gray-700">Tipo de aplicação:</label>
                            <Select 
                              value={halfInvoiceType}
                              onValueChange={(value: 'quantity' | 'price') => setHalfInvoiceType(value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="quantity">Na quantidade</SelectItem>
                                <SelectItem value="price">No preço</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">
                              {halfInvoiceType === 'quantity' 
                                ? 'A nota fiscal será emitida com quantidade reduzida mantendo o preço original' 
                                : 'A nota fiscal será emitida com preço reduzido mantendo a quantidade original'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">Nenhuma opção de desconto cadastrada.</p>
                </div>
              )}

              {!applyDiscounts && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
                  <div className="flex items-start">
                    <Tags className="h-5 w-5 text-amber-600 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-700">Descontos desativados</p>
                      <p className="text-sm text-amber-600">
                        As opções selecionadas não afetarão o preço dos produtos, mas serão registradas no pedido.
                        {deliveryLocation && <span className="block mt-1 font-medium">A taxa de entrega ainda será aplicada.</span>}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Opções Tributárias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Opção de Substituição Tributária */}
              {discountOptions.filter(option => option.id === '3').map(option => (
                <div key={option.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        ICMS Substituição tributária {applyDiscounts && (
                          <span className="text-red-600">(+{option.value}%)</span>
                        )}
                        {option.id === '3' && isDiscountOptionSelected('2') && applyDiscounts && (
                          <span className="text-red-600 ml-1">
                            (Ajustado: +{(option.value * halfInvoicePercentage / 100).toFixed(2)}%)
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        Acréscimo do ICMS por substituição tributária (calculado com MVA de cada produto)
                      </p>
                    </div>
                    <Switch
                      checked={isDiscountOptionSelected(option.id)}
                      onCheckedChange={() => toggleDiscountOption(option.id)}
                    />
                  </div>
                </div>
              ))}

              {/* Opção de IPI */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      IPI {applyDiscounts && settings && (
                        <span className="text-red-600">(+{settings.ipiRate}%)</span>
                      )}
                      {isDiscountOptionSelected('2') && applyDiscounts && (
                        <span className="text-red-600 ml-1">
                          (Ajustado: +{effectiveIPIRate.toFixed(2)}%)
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">Acréscimo de Imposto sobre Produtos Industrializados</p>
                  </div>
                  <Switch
                    checked={withIPI}
                    onCheckedChange={toggleIPI}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Observações do Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Digite aqui observações importantes sobre este pedido, como instruções de entrega, detalhes específicos ou outras informações relevantes..."
              className="min-h-[120px] resize-y"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Resumo do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-red-600">
                <span>Descontos:</span>
                <span>-{formatCurrency(totalDiscount)}</span>
              </div>
              {isDiscountOptionSelected('3') && applyDiscounts && taxSubstitutionValue > 0 && (
                <div className="flex justify-between text-sm text-orange-600">
                  <span>ICMS Substituição Tributária ({effectiveTaxRate.toFixed(2)}% ICMS-ST):</span>
                  <span>+{formatCurrency(taxSubstitutionValue)}</span>
                </div>
              )}
              {withIPI && applyDiscounts && ipiValue > 0 && (
                <div className="flex justify-between text-sm text-orange-600">
                  <span>IPI ({effectiveIPIRate.toFixed(2)}%):</span>
                  <span>+{formatCurrency(ipiValue)}</span>
                </div>
              )}
              {deliveryLocation && (
                <div className="flex justify-between text-sm text-amber-600">
                  <span>Taxa de entrega ({deliveryLocation === 'capital' ? 'Capital' : 'Interior'}):</span>
                  <span>{formatCurrency(deliveryFee)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between font-medium text-lg">
                <span>Total:</span>
                <span className="text-ferplas-600">{formatCurrency(total)}</span>
              </div>
            </div>
            
            <Button 
              className="w-full bg-ferplas-500 hover:bg-ferplas-600 button-transition py-6"
              onClick={handleSubmitOrder}
              disabled={isSubmitting || items.length === 0 || !customer}
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Enviando...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
                  Finalizar Pedido
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Cart;
