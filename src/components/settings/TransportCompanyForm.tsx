
import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { TransportCompany } from '@/types/types';
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

interface TransportCompanyFormProps {
  company?: TransportCompany | null;
  onClose: () => void;
  onSuccess: () => void;
}

const TransportCompanyForm: React.FC<TransportCompanyFormProps> = ({
  company,
  onClose,
  onSuccess
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: company?.name || '',
      document: company?.document || '',
      email: company?.email || '',
      phone: company?.phone || '',
      whatsapp: company?.whatsapp || ''
    }
  });
  
  const handleSubmit = async (data: FormValues) => {
    try {
      if (company) {
        // Update existing company
        const { error } = await supabase
          .from('transport_companies')
          .update({
            name: data.name,
            document: data.document,
            email: data.email || null,
            phone: data.phone || null,
            whatsapp: data.whatsapp || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', company.id);
          
        if (error) throw error;
        toast.success('Transportadora atualizada com sucesso!');
      } else {
        // Create new company
        const { error } = await supabase
          .from('transport_companies')
          .insert({
            name: data.name,
            document: data.document,
            email: data.email || null,
            phone: data.phone || null,
            whatsapp: data.whatsapp || null
          });
          
        if (error) throw error;
        toast.success('Transportadora adicionada com sucesso!');
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving transport company:', error);
      toast.error('Erro ao salvar transportadora');
    }
  };

  return (
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
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">
            {company ? 'Salvar' : 'Adicionar'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TransportCompanyForm;
