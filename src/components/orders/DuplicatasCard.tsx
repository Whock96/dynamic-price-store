
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Edit, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Duplicata } from "@/types/duplicata";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Props {
  duplicatas: Duplicata[];
  onAdd?: () => void;
  onEdit?: (duplicata: Duplicata) => void;
  onDelete?: (duplicata: Duplicata) => void;
  onDeletePdf?: (duplicata: Duplicata) => void;
  isLoading?: boolean;
}

const formatCurrency = (val: number | undefined) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val || 0);
};

const DuplicatasCard: React.FC<Props> = ({ 
  duplicatas, 
  onAdd, 
  onEdit, 
  onDelete, 
  onDeletePdf,
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Duplicatas</span>
            {onAdd && (
              <Button size="sm" onClick={onAdd}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Duplicata
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ferplas-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!duplicatas?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Duplicatas</span>
            {onAdd && (
              <Button size="sm" onClick={onAdd}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Duplicata
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Nenhuma duplicata cadastrada para este pedido.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Duplicatas</span>
          {onAdd && (
            <Button size="sm" onClick={onAdd}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Duplicata
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap px-4 py-3 font-medium">Número</TableHead>
                <TableHead className="whitespace-nowrap px-4 py-3 font-medium">Emissão</TableHead>
                <TableHead className="whitespace-nowrap px-4 py-3 font-medium">Vencimento</TableHead>
                <TableHead className="whitespace-nowrap px-4 py-3 font-medium">Valor</TableHead>
                <TableHead className="whitespace-nowrap px-4 py-3 font-medium">Acresc.</TableHead>
                <TableHead className="whitespace-nowrap px-4 py-3 font-medium">Desconto</TableHead>
                <TableHead className="whitespace-nowrap px-4 py-3 font-medium">Modo Pgto.</TableHead>
                <TableHead className="whitespace-nowrap px-4 py-3 font-medium">Portador</TableHead>
                <TableHead className="whitespace-nowrap px-4 py-3 font-medium">Banco</TableHead>
                <TableHead className="whitespace-nowrap px-4 py-3 font-medium">Situação</TableHead>
                <TableHead className="whitespace-nowrap px-4 py-3 font-medium">Valor Recebido</TableHead>
                <TableHead className="whitespace-nowrap px-4 py-3 font-medium">Data Pgto</TableHead>
                <TableHead className="whitespace-nowrap px-4 py-3 font-medium">Banco Pgto</TableHead>
                <TableHead className="whitespace-nowrap px-4 py-3 font-medium">Boleto PDF</TableHead>
                {(onEdit || onDelete) && (
                  <TableHead className="whitespace-nowrap px-4 py-3 font-medium">Ações</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {duplicatas.map((d) => (
                <TableRow key={d.id} className="hover:bg-gray-50 transition">
                  <TableCell className="px-4 py-3 border-t">{d.numeroDuplicata}</TableCell>
                  <TableCell className="px-4 py-3 border-t">
                    {d.dataEmissao ? format(new Date(d.dataEmissao), "dd/MM/yyyy", { locale: ptBR }) : '-'}
                  </TableCell>
                  <TableCell className="px-4 py-3 border-t">
                    {d.dataVencimento ? format(new Date(d.dataVencimento), "dd/MM/yyyy", { locale: ptBR }) : '-'}
                  </TableCell>
                  <TableCell className="px-4 py-3 border-t">{formatCurrency(d.valor)}</TableCell>
                  <TableCell className="px-4 py-3 border-t">{formatCurrency(d.valorAcrescimo)}</TableCell>
                  <TableCell className="px-4 py-3 border-t">{formatCurrency(d.valorDesconto)}</TableCell>
                  <TableCell className="px-4 py-3 border-t">{d.modoPagamento?.nome || '-'}</TableCell>
                  <TableCell className="px-4 py-3 border-t">{d.portador?.nome || '-'}</TableCell>
                  <TableCell className="px-4 py-3 border-t">{d.banco?.nome || '-'}</TableCell>
                  <TableCell className="px-4 py-3 border-t">{d.paymentStatus?.nome || '-'}</TableCell>
                  <TableCell className="px-4 py-3 border-t">
                    {d.valorRecebido !== undefined ? formatCurrency(d.valorRecebido) : '-'}
                  </TableCell>
                  <TableCell className="px-4 py-3 border-t">
                    {d.dataPagamento ? format(new Date(d.dataPagamento), "dd/MM/yyyy", { locale: ptBR }) : '-'}
                  </TableCell>
                  <TableCell className="px-4 py-3 border-t">{d.bancoPagamento?.nome || '-'}</TableCell>
                  <TableCell className="px-4 py-3 border-t">
                    {d.pdfBoletoPath ? (
                      <div className="flex items-center space-x-1">
                        <a href={d.pdfBoletoPath} target="_blank" rel="noopener noreferrer">
                          <Button size="icon" variant="ghost" className="text-ferplas-600 hover:bg-ferplas-50" title="Baixar Boleto PDF">
                            <Download size={18} />
                          </Button>
                        </a>
                        {onDeletePdf && (
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="text-red-600 hover:bg-red-50" 
                            title="Excluir PDF"
                            onClick={() => onDeletePdf(d)}
                          >
                            <Trash2 size={18} />
                          </Button>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  {(onEdit || onDelete) && (
                    <TableCell className="px-4 py-3 border-t">
                      <div className="flex items-center space-x-1">
                        {onEdit && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 px-2" 
                            onClick={() => onEdit(d)}
                          >
                            <Edit size={16} className="mr-1" /> 
                            Editar
                          </Button>
                        )}
                        {onDelete && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 px-2 text-red-600 hover:bg-red-50"
                            onClick={() => onDelete(d)}
                          >
                            <Trash2 size={16} className="mr-1" />
                            Excluir
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default DuplicatasCard;
