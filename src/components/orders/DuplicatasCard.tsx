
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Duplicata } from "@/types/duplicata";

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
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th>Número</th>
                <th>Emissão</th>
                <th>Vencimento</th>
                <th>Valor</th>
                <th>Acresc.</th>
                <th>Desconto</th>
                <th>Modo Pgto.</th>
                <th>Portador</th>
                <th>Banco</th>
                <th>Situação</th>
                <th>Valor Recebido</th>
                <th>Data Pgto</th>
                <th>Banco Pgto</th>
                <th>Boleto PDF</th>
              </tr>
            </thead>
            <tbody>
              {duplicatas.map((d) => (
                <tr key={d.id} className="border-b hover:bg-gray-100 transition">
                  <td>{d.numeroDuplicata}</td>
                  <td>{d.dataEmissao ? format(new Date(d.dataEmissao), "dd/MM/yyyy", { locale: ptBR }) : '-'}</td>
                  <td>{d.dataVencimento ? format(new Date(d.dataVencimento), "dd/MM/yyyy", { locale: ptBR }) : '-'}</td>
                  <td>{formatCurrency(d.valor)}</td>
                  <td>{formatCurrency(d.valorAcrescimo)}</td>
                  <td>{formatCurrency(d.valorDesconto)}</td>
                  <td>{d.modoPagamento?.nome || '-'}</td>
                  <td>{d.portador?.nome || '-'}</td>
                  <td>{d.banco?.nome || '-'}</td>
                  <td>{d.paymentStatus?.nome || '-'}</td>
                  <td>{d.valorRecebido !== undefined ? formatCurrency(d.valorRecebido) : '-'}</td>
                  <td>{d.dataPagamento ? format(new Date(d.dataPagamento), "dd/MM/yyyy", { locale: ptBR }) : '-'}</td>
                  <td>{d.bancoPagamento?.nome || '-'}</td>
                  <td>
                    {d.pdfBoletoPath ? (
                      <a href={d.pdfBoletoPath} target="_blank" rel="noopener noreferrer">
                        <Button size="icon" variant="ghost" className="text-ferplas-600 hover:bg-ferplas-50" title="Baixar Boleto PDF">
                          <Download size={18} />
                        </Button>
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default DuplicatasCard;
