
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
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
}

const formatCurrency = (val: number | undefined) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val || 0);
};

const DuplicatasCard: React.FC<Props> = ({ duplicatas }) => {
  if (!duplicatas?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Duplicatas</CardTitle>
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
        <CardTitle>Duplicatas</CardTitle>
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
                      <a href={d.pdfBoletoPath} target="_blank" rel="noopener noreferrer">
                        <Button size="icon" variant="ghost" className="text-ferplas-600 hover:bg-ferplas-50" title="Baixar Boleto PDF">
                          <Download size={18} />
                        </Button>
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
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
