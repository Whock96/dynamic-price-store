import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

import { useOrders } from '@/context/OrderContext';
import { useCustomers } from '@/context/CustomerContext';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/utils/formatters';
import { useTransportCompanies } from '@/context/TransportCompanyContext';

const orderUpdateSchema = z.object({
  customerId: z.string().min(1, { message: "Cliente é obrigatório." }),
  status: z.enum(['pending', 'confirmed', 'invoiced', 'completed', 'canceled']),
  shipping: z.enum(['delivery', 'pickup']),
  fullInvoice: z.boolean().default(false),
  taxSubstitution: z.boolean().default(false),
  paymentMethod: z.enum(['cash', 'credit']),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
  observations: z.string().optional(),
  deliveryLocation: z.enum(['capital', 'interior']).optional().nullable(),
  transportCompanyId: z.string().optional().nullable(),
});

type OrderUpdateFormValues = z.infer<typeof orderUpdateSchema>;

const OrderUpdate = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getOrderById, updateOrder } = useOrders();
  const { customers } = useCustomers();
  const { user } = useAuth();
  const { companies } = useTransportCompanies();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<OrderUpdateFormValues>({
    resolver: zodResolver(orderUpdateSchema),
    defaultValues: {
      customerId: "",
      status: 'pending',
      shipping: 'delivery',
      fullInvoice: false,
      taxSubstitution: false,
      paymentMethod: 'cash',
    }
  });

  useEffect(() => {
    const loadOrder = async () => {
      if (id) {
        setIsLoading(true);
        const order = await getOrderById(id);
        if (order) {
          // Populate the form with order data
          setValue("customerId", order.customerId);
          setValue("status", order.status);
          setValue("shipping", order.shipping);
          setValue("fullInvoice", order.fullInvoice);
          setValue("taxSubstitution", order.taxSubstitution);
          setValue("paymentMethod", order.paymentMethod);
          setValue("notes", order.notes || "");
          setValue("observations", order.observations || "");
          setValue("paymentTerms", order.paymentTerms || "");
          setValue("deliveryLocation", order.deliveryLocation || null);
          setValue("transportCompanyId", order.transportCompanyId || null);
        } else {
          toast.error("Pedido não encontrado.");
          navigate("/orders");
        }
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [id, navigate, setValue, getOrderById]);

  const onSubmit = async (data: OrderUpdateFormValues) => {
    setIsSubmitting(true);
    try {
      if (id) {
        const success = await updateOrder(id, data);
        if (success) {
          toast.success("Pedido atualizado com sucesso!");
          navigate(`/orders/${id}`);
        } else {
          toast.error("Erro ao atualizar o pedido.");
        }
      } else {
        toast.error("ID do pedido inválido.");
      }
    } catch (error) {
      console.error("Erro ao atualizar o pedido:", error);
      toast.error("Erro ao atualizar o pedido.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Editar Pedido</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Pedido</CardTitle>
            <CardDescription>
              Altere as informações do pedido.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div>
              <Label htmlFor="customerId">Cliente</Label>
              <Controller
                control={control}
                name="customerId"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.customerId && (
                <p className="text-red-500 text-sm">{errors.customerId.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-full">
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
                )}
              />
              {errors.status && (
                <p className="text-red-500 text-sm">{errors.status.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Controller
                control={control}
                name="notes"
                render={({ field }) => (
                  <Textarea
                    placeholder="Observações sobre o pedido"
                    {...field}
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Opções de Entrega</CardTitle>
            <CardDescription>
              Configure as opções de entrega do pedido.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div>
              <Label htmlFor="shipping">Método de Entrega</Label>
              <Controller
                control={control}
                name="shipping"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="delivery">Entrega</SelectItem>
                      <SelectItem value="pickup">Retirada</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.shipping && (
                <p className="text-red-500 text-sm">{errors.shipping.message}</p>
              )}
            </div>

            {/* Add transport company selection */}
            {/* This should be inside the shipping options section */}
            <div className="space-y-2">
              <Label htmlFor="transportCompanyId">Transportadora</Label>
              <Controller
                control={control}
                name="transportCompanyId"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione uma transportadora" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhuma transportadora</SelectItem>
                      {companies.map(company => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Label htmlFor="fullInvoice">Nota Fiscal Completa</Label>
              <Controller
                control={control}
                name="fullInvoice"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    id="fullInvoice"
                  />
                )}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="taxSubstitution">Substituição Tributária</Label>
              <Controller
                control={control}
                name="taxSubstitution"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    id="taxSubstitution"
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações de Pagamento</CardTitle>
            <CardDescription>
              Configure as informações de pagamento do pedido.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div>
              <Label htmlFor="paymentMethod">Método de Pagamento</Label>
              <Controller
                control={control}
                name="paymentMethod"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="credit">Crédito</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.paymentMethod && (
                <p className="text-red-500 text-sm">{errors.paymentMethod.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Condições de Pagamento</Label>
              <Controller
                control={control}
                name="paymentTerms"
                render={({ field }) => (
                  <Input
                    placeholder="Condições de pagamento"
                    {...field}
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Atualizando...
            </>
          ) : (
            "Atualizar Pedido"
          )}
        </Button>
      </form>
    </div>
  );
};

export default OrderUpdate;
