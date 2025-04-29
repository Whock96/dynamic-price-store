
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Edit, Trash2, Plus, Eye } from "lucide-react";
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
  onViewDetails?: (duplicata: Duplicata) => void;
  readOnly?: boolean;
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
  onViewDetails,
  readOnly = false 
}) => {
  if (!duplicatas?.length && readOnly) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Duplicatas</CardTitle>
          {onAdd && (
            <Button onClick={onAdd} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Duplicata
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Nenhuma duplicata cadastrada para este pedido.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Duplicatas</CardTitle>
        {onAdd && (
          <Button onClick={onAdd} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Duplicata
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap px-4 py-3 font-medium">Número</TableHead>
                <TableHead className="whitespace-nowrap px-4 py-3 font-medium">Vencimento</TableHead>
                <TableHead className="whitespace-nowrap px-4 py-3 font-medium">Valor Final</TableHead>
                <TableHead className="whitespace-nowrap px-4 py-3 font-medium">Modo Pgto.</TableHead>
                <TableHead className="whitespace-nowrap px-4 py-3 font-medium">Banco</TableHead>
                <TableHead className="whitespace-nowrap px-4 py-3 font-medium">Situação</TableHead>
                <TableHead className="whitespace-nowrap px-4 py-3 font-medium">Boleto</TableHead>
                <TableHead className="whitespace-nowrap px-4 py-3 font-medium text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {duplicatas.length > 0 ? (
                duplicatas.map((d) => (
                  <TableRow key={d.id} className="hover:bg-gray-50 transition">
                    <TableCell className="px-4 py-3 border-t">{d.numeroDuplicata}</TableCell>
                    <TableCell className="px-4 py-3 border-t">
                      {d.dataVencimento ? format(new Date(d.dataVencimento), "dd/MM/yyyy", { locale: ptBR }) : '-'}
                    </TableCell>
                    <TableCell className="px-4 py-3 border-t font-medium text-ferplas-600">{formatCurrency(d.valorFinal)}</TableCell>
                    <TableCell className="px-4 py-3 border-t">{d.modoPagamento?.nome || '-'}</TableCell>
                    <TableCell className="px-4 py-3 border-t">{d.banco?.nome || '-'}</TableCell>
                    <TableCell className="px-4 py-3 border-t">{d.paymentStatus?.nome || '-'}</TableCell>
                    <TableCell className="px-4 py-3 border-t">
                      {d.pdfBoletoPath ? (
                        <a href={d.pdfBoletoPath} target="_blank" rel="noopener noreferrer">
                          <Button size="icon" variant="ghost" className="text-ferplas-600 hover:bg-ferplas-50" title="Baixar Boleto PDF">
                            <Download size={18} />
                          </Button>
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 border-t text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onViewDetails && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => onViewDetails(d)}
                            className="h-8 px-2 text-ferplas-600 border-ferplas-200 hover:bg-ferplas-50"
                            title="Ver detalhes"
                          >
                            <Eye size={16} className="mr-1" />
                            Detalhes
                          </Button>
                        )}
                        
                        {!readOnly && onEdit && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => onEdit(d)}
                            className="h-8 px-2"
                            title="Editar"
                          >
                            <Edit size={16} className="mr-1" />
                            Editar
                          </Button>
                        )}
                        
                        {!readOnly && onDelete && (
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => onDelete(d)}
                            className="h-8 w-8 text-red-600 hover:bg-red-50"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                        
                        {!readOnly && onDeletePdf && d.pdfBoletoPath && (
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => onDeletePdf(d)} 
                            className="text-red-600 hover:bg-red-50"
                            title="Excluir PDF"
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <span className="text-muted-foreground">
                      Nenhuma duplicata cadastrada
                    </span>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default DuplicatasCard;
