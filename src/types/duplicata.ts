
export interface Duplicata {
  id: string;
  orderId: string;
  numeroDuplicata: string;
  dataEmissao: string; // ISO or yyyy-mm-dd
  dataVencimento: string; // ISO or yyyy-mm-dd
  valor: number;
  valorAcrescimo: number;
  valorDesconto: number;
  valorFinal: number;
  modoPagamentoId: string;
  portadorId: string;
  bancoId: string;
  paymentStatusId: string;
  valorRecebido?: number;
  dataPagamento?: string;
  bancoPagamentoId?: string;
  pdfBoletoPath?: string | null;
  createdAt?: string;
  updatedAt?: string;
  comissionDuplicata?: number; // Percentual de comissão
  comissionValue?: number; // Valor em reais da comissão
  // Table lookups for selects
  modoPagamento?: RefTable;
  portador?: RefTable;
  banco?: RefTable;
  bancoPagamento?: RefTable;
  paymentStatus?: RefTable;
}

export interface RefTable {
  id: string;
  nome: string;
}
