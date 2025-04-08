
import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TransportCompany } from '@/types/types';
import { validateCNPJ } from '@/utils/validators';

const formSchema = z.object({
  name: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres' }),
  document: z.string()
    .min(14, { message: 'CNPJ inválido' })
    .refine(value => validateCNPJ(value), { message: 'CNPJ inválido' }),
  email: z.string().email({ message: 'Email inválido' }).optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  whatsapp: z.string().optional().or(z.literal(''))
});

type FormValues = z.infer<typeof formSchema>;

interface TransportCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormValues) => void;
  initialData?: TransportCompany;
  mode?: 'add' | 'edit';
}

const TransportCompanyDialog: React.FC<TransportCompanyDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode = 'add'
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      document: initialData?.document || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      whatsapp: initialData?.whatsapp || ''
    }
  });
  
  const handleSubmit = (data: FormValues) => {
    onSubmit(data);
  };

  const title = mode === 'add' ? 'Adicionar Transportadora' : 'Editar Transportadora';
  const actionText = mode === 'add' ? 'Adicionar' : 'Salvar';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === 'add' 
              ? 'Preencha os dados para adicionar uma nova transportadora.'
              : 'Edite os dados da transportadora.'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da transportadora" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="document"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CNPJ</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="00.000.000/0000-00" 
                      {...field} 
                      onChange={(e) => {
                        // Remove non-digit characters and format CNPJ
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 14) {
                          // Format as CNPJ
                          if (value.length > 2) value = value.replace(/^(\d{2})/, '$1.');
                          if (value.length > 6) value = value.replace(/^(\d{2})\.(\d{3})/, '$1.$2.');
                          if (value.length > 10) value = value.replace(/^(\d{2})\.(\d{3})\.(\d{3})/, '$1.$2.$3/');
                          if (value.length > 15) value = value.replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})/, '$1.$2.$3/$4-');
                        }
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="email@transportadora.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="(00) 0000-0000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp</FormLabel>
                  <FormControl>
                    <Input placeholder="(00) 00000-0000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">{actionText}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TransportCompanyDialog;
