
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
          <Table className="w-full text-sm">
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap px-4 py-2">Número</TableHead>
                <TableHead className="whitespace-nowrap px-4 py-2">Emissão</TableHead>
                <TableHead className="whitespace-nowrap px-4 py-2">Vencimento</TableHead>
                <TableHead className="whitespace-nowrap px-4 py-2">Valor</TableHead>
                <TableHead className="whitespace-nowrap px-4 py-2">Acresc.</TableHead>
                <TableHead className="whitespace-nowrap px-4 py-2">Desconto</TableHead>
                <TableHead className="whitespace-nowrap px-4 py-2">Modo Pgto.</TableHead>
                <TableHead className="whitespace-nowrap px-4 py-2">Portador</TableHead>
                <TableHead className="whitespace-nowrap px-4 py-2">Banco</TableHead>
                <TableHead className="whitespace-nowrap px-4 py-2">Situação</TableHead>
                <TableHead className="whitespace-nowrap px-4 py-2">Valor Recebido</TableHead>
                <TableHead className="whitespace-nowrap px-4 py-2">Data Pgto</TableHead>
                <TableHead className="whitespace-nowrap px-4 py-2">Banco Pgto</TableHead>
                <TableHead className="whitespace-nowrap px-4 py-2">Boleto PDF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {duplicatas.map((d) => (
                <TableRow key={d.id} className="hover:bg-gray-50 transition">
                  <TableCell className="px-4 py-2">{d.numeroDuplicata}</TableCell>
                  <TableCell className="px-4 py-2">
                    {d.dataEmissao ? format(new Date(d.dataEmissao), "dd/MM/yyyy", { locale: ptBR }) : '-'}
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    {d.dataVencimento ? format(new Date(d.dataVencimento), "dd/MM/yyyy", { locale: ptBR }) : '-'}
                  </TableCell>
                  <TableCell className="px-4 py-2">{formatCurrency(d.valor)}</TableCell>
                  <TableCell className="px-4 py-2">{formatCurrency(d.valorAcrescimo)}</TableCell>
                  <TableCell className="px-4 py-2">{formatCurrency(d.valorDesconto)}</TableCell>
                  <TableCell className="px-4 py-2">{d.modoPagamento?.nome || '-'}</TableCell>
                  <TableCell className="px-4 py-2">{d.portador?.nome || '-'}</TableCell>
                  <TableCell className="px-4 py-2">{d.banco?.nome || '-'}</TableCell>
                  <TableCell className="px-4 py-2">{d.paymentStatus?.nome || '-'}</TableCell>
                  <TableCell className="px-4 py-2">
                    {d.valorRecebido !== undefined ? formatCurrency(d.valorRecebido) : '-'}
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    {d.dataPagamento ? format(new Date(d.dataPagamento), "dd/MM/yyyy", { locale: ptBR }) : '-'}
                  </TableCell>
                  <TableCell className="px-4 py-2">{d.bancoPagamento?.nome || '-'}</TableCell>
                  <TableCell className="px-4 py-2">
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

