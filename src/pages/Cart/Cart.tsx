
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Trash2, ShoppingCart, Package, Search, Send 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useCart } from '../../context/CartContext';
import { Customer, Product } from '@/types/types';
import { toast } from 'sonner';
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

const MOCK_CUSTOMERS: Customer[] = Array.from({ length: 10 }, (_, i) => ({
  id: `customer-${i + 1}`,
  companyName: `Cliente ${i + 1} Ltda.`,
  document: Math.random().toString().slice(2, 13),
  salesPersonId: i % 3 === 0 ? '1' : i % 3 === 1 ? '2' : '3',
  street: `Rua ${i + 1}`,
  number: `${i * 10 + 100}`,
  noNumber: false,
  complement: i % 2 === 0 ? `Sala ${i + 1}` : '',
  city: i % 4 === 0 ? 'São Paulo' : i % 4 === 1 ? 'Rio de Janeiro' : i % 4 === 2 ? 'Belo Horizonte' : 'Curitiba',
  state: i % 4 === 0 ? 'SP' : i % 4 === 1 ? 'RJ' : i % 4 === 2 ? 'MG' : 'PR',
  zipCode: `${Math.floor(Math.random() * 90000) + 10000}-${Math.floor(Math.random() * 900) + 100}`,
  phone: `(${Math.floor(Math.random() * 90) + 10}) ${Math.floor(Math.random() * 90000) + 10000}-${Math.floor(Math.random() * 9000) + 1000}`,
  email: `cliente${i + 1}@example.com`,
  defaultDiscount: Math.floor(Math.random() * 10),
  createdAt: new Date(),
  updatedAt: new Date(),
}));

const MOCK_PRODUCTS: Product[] = Array.from({ length: 20 }, (_, i) => ({
  id: `product-${i + 1}`,
  name: `Produto ${i + 1}`,
  description: `Descrição do produto ${i + 1}. Este é um produto de alta qualidade.`,
  listPrice: Math.floor(Math.random() * 900) + 100,
  minPrice: Math.floor(Math.random() * 80) + 50,
  weight: Math.floor(Math.random() * 5) + 0.5,
  quantity: Math.floor(Math.random() * 100) + 10,
  volume: Math.floor(Math.random() * 3) + 1,
  categoryId: i % 3 === 0 ? '1' : i % 3 === 1 ? '2' : '3',
  subcategoryId: i % 5 === 0 ? '1' : i % 5 === 1 ? '2' : i % 5 === 2 ? '3' : i % 5 === 3 ? '4' : '5',
  imageUrl: 'https://via.placeholder.com/150',
  createdAt: new Date(),
  updatedAt: new Date(),
}));

const Cart = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const productParam = searchParams.get('product');
  const customerParam = searchParams.get('customer');
  
  const { 
    items, customer, setCustomer, addItem, removeItem, updateItemQuantity,
    updateItemDiscount, discountOptions, toggleDiscountOption, isDiscountOptionSelected,
    totalItems, subtotal, totalDiscount, total, sendOrder, clearCart
  } = useCart();
  
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  
  const filteredCustomers = MOCK_CUSTOMERS.filter(c => 
    c.companyName.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.document.includes(customerSearch)
  );
  
  const filteredProducts = MOCK_PRODUCTS.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.description.toLowerCase().includes(productSearch.toLowerCase())
  );
  
  useEffect(() => {
    if (customerParam && !customer) {
      const selectedCustomer = MOCK_CUSTOMERS.find(c => c.id === customerParam);
      if (selectedCustomer) {
        setCustomer(selectedCustomer);
        toast.success(`Cliente "${selectedCustomer.companyName}" selecionado`);
      }
    }
    
    if (productParam) {
      const selectedProduct = MOCK_PRODUCTS.find(p => p.id === productParam);
      if (selectedProduct) {
        addItem(selectedProduct, 1);
        navigate('/cart', { replace: true });
      }
    }
  }, [customerParam, productParam, customer, addItem, navigate, setCustomer]);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };
  
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

      {/* Redesigned layout with customer selection on top */}
      <div className="space-y-6">
        {/* Customer selection card - now at the top */}
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
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Selecionar Cliente</DialogTitle>
                    <DialogDescription>
                      Escolha um cliente para este pedido ou adicione um novo.
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
                    <div className="max-h-96 overflow-y-auto">
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
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">Nenhum cliente encontrado. Altere sua busca ou adicione um novo cliente.</p>
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

        {/* Main content grid for products and options */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Products section - expanded to take more space */}
          <div className="lg:col-span-3">
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
                      
                      {filteredProducts.length > 0 ? (
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
                                    <div className="text-sm text-gray-500">{p.description.substring(0, 30)}...</div>
                                  </TableCell>
                                  <TableCell>{formatCurrency(p.listPrice)}</TableCell>
                                  <TableCell>{p.quantity} unidades</TableCell>
                                  <TableCell className="text-right">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="h-8 px-2 text-ferplas-500"
                                      onClick={() => {
                                        addItem(p, 1);
                                        toast.success(`${p.name} adicionado ao carrinho`);
                                      }}
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
                          <TableHead>Quantidade</TableHead>
                          <TableHead>Subtotal</TableHead>
                          <TableHead className="w-14"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map(item => (
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
                        ))}
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
          </div>
          
          {/* Right sidebar with discount options and order summary */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium">Opções de Desconto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {discountOptions.length > 0 ? (
                    discountOptions.map(option => (
                      <div key={option.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {option.name} {option.type === 'discount' ? '(-' : '(+'}{option.value}%)
                          </p>
                          <p className="text-sm text-gray-500">{option.description}</p>
                        </div>
                        <Switch
                          checked={isDiscountOptionSelected(option.id)}
                          onCheckedChange={() => toggleDiscountOption(option.id)}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500">Nenhuma opção de desconto cadastrada.</p>
                    </div>
                  )}
                </div>
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
      </div>
    </div>
  );
};

export default Cart;
