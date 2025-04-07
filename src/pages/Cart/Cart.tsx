
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';

const Cart = () => {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Carrinho</h1>
        <p className="text-muted-foreground">
          Adicione produtos ao carrinho e finalize seu pedido
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Produtos no Carrinho</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex flex-col items-center justify-center text-center border rounded-md border-dashed p-4">
            <ShoppingCart className="h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-600 mb-1">Seu carrinho está vazio</h3>
            <p className="text-gray-500 mb-4">Adicione produtos ao seu carrinho para continuar</p>
            <Button 
              variant="outline" 
              className="text-ferplas-500 hover:bg-ferplas-50"
            >
              Adicionar Produtos
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Cart;
