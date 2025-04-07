import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useSupabaseData } from '@/hooks/use-supabase-data';
import { Tables } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

type UserType = Tables<'user_types'>;

const UserTypes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch user types from Supabase
  const { 
    data: userTypes, 
    isLoading: userTypesLoading,
    error: userTypesError,
    deleteRecord
  } = useSupabaseData<UserType>('user_types');

  // Show toast errors if any
  useEffect(() => {
    if (userTypesError) {
      toast({ 
        title: "Erro ao carregar tipos de usuário", 
        description: userTypesError.message, 
        variant: "destructive" 
      });
    }
  }, [userTypesError, toast]);

  // Filter user types based on search query
  const filteredUserTypes = userTypes.filter(userType => {
    const nameMatch = userType.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const descriptionMatch = userType.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    return nameMatch || descriptionMatch;
  });

  const isLoading = userTypesLoading;

  // Function to navigate to the user type details page
  const handleUserTypeClick = (userTypeId: string) => {
    navigate(`/settings/user-types/${userTypeId}`);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord(id);
      toast({
        title: "Sucesso",
        description: "Tipo de usuário excluído com sucesso.",
      })
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Tipos de Usuário</h1>
          <p className="text-muted-foreground">
            Gerencie os tipos de usuário da sua empresa.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => navigate('/settings/user-types/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Tipo de Usuário
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="relative">
              <Input
                placeholder="Buscar tipos de usuário..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <Table>
          <TableCaption>Lista de tipos de usuário da empresa.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton />
                    </TableCell>
                    <TableCell>
                      <Skeleton />
                    </TableCell>
                    <TableCell>
                      <Skeleton />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton />
                    </TableCell>
                  </TableRow>
                ))}
              </>
            ) : filteredUserTypes.length > 0 ? (
              filteredUserTypes.map((userType) => (
                <TableRow key={userType.id}>
                  <TableCell className="font-medium">{userType.id}</TableCell>
                  <TableCell>{userType.name}</TableCell>
                  <TableCell>{userType.description}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUserTypeClick(userType.id)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(userType.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Nenhum tipo de usuário encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default UserTypes;
