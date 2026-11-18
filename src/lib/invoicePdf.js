import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { INVOICE_WATERMARK, invoiceDate, invoiceMoney, validateInvoice } from './invoice.js';
const text = value => String(value || '').replace(/[\u2010-\u2015]/g,'-').replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"');
export function createInvoicePDF(source) {
  const invoice=validateInvoice(source);
  const doc=new jsPDF({unit:'mm',format:'a4',compress:true});
  doc.setProperties({title:`Optimax Invoice ${invoice.invoice_number}`,subject:'Paid order invoice',author:'Optimax Resources',creator:'Optimax'});
  doc.setCreationDate(new Date(invoice.issued_at));
  const decorated=new Set();
  function decorate() {
    const page=doc.internal.getCurrentPageInfo().pageNumber;
    if(decorated.has(page)) return;
    decorated.add(page);
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({opacity:INVOICE_WATERMARK.opacity}));
    doc.setTextColor(INVOICE_WATERMARK.color);
    doc.setFont('helvetica','normal');
    doc.setFontSize(210*72/25.4*INVOICE_WATERMARK.fontScale);
    doc.text(INVOICE_WATERMARK.text,105,148.5,{align:'center',angle:-INVOICE_WATERMARK.angle});
    doc.restoreGraphicsState();
    if(page>1){doc.setFontSize(9);doc.setTextColor('#64748b');doc.text(`OPTIMAX  |  ${invoice.invoice_number}`,18,13);}
  }
  const common={margin:{left:18,right:18,top:22,bottom:22},styles:{font:'helvetica',fontSize:9,textColor:'#334155',cellPadding:3,fillColor:false,overflow:'linebreak'},willDrawPage:decorate};
  doc.setFont('helvetica','bold');doc.setTextColor('#7045aa');doc.setFontSize(24);doc.text('OPTIMAX',18,26);
  doc.setFontSize(21);doc.setTextColor('#0f172a');doc.text('INVOICE',192,26,{align:'right'});
  doc.setFontSize(10);doc.setTextColor('#64748b');doc.text(invoice.invoice_number,192,34,{align:'right'});
  doc.setFontSize(9);doc.setTextColor('#166534');doc.text('PAID',192,42,{align:'right'});
  doc.setDrawColor('#a879ed');doc.setLineWidth(.7);doc.line(18,48,192,48);
  const business=invoice.business_snapshot || {};const customer=invoice.customer_snapshot || {};
  autoTable(doc,{...common,startY:52,theme:'plain',body:[[text([business.name,business.address,business.area,business.email,business.phone].filter(Boolean).join('\n'))]],styles:{...common.styles,fontSize:9,cellPadding:0}});
  autoTable(doc,{...common,startY:doc.lastAutoTable.finalY+8,theme:'plain',head:[['BILLED TO','ORDER & PAYMENT']],body:[[
    text([customer.name,customer.email,customer.phone,customer.address_line,[customer.city,customer.state].filter(Boolean).join(', ')].filter(Boolean).join('\n')),
    text(`Issued: ${invoiceDate(invoice.issued_at)}\nOrder: ${invoice.order_ref}\nPayment: ${invoice.payment_reference}\nMethod: Paystack`),
  ]],headStyles:{textColor:'#7045aa',fontSize:9,fillColor:false},columnStyles:{0:{cellWidth:87},1:{cellWidth:87}}});
  autoTable(doc,{...common,startY:doc.lastAutoTable.finalY+8,theme:'plain',head:[['#','DESCRIPTION','QTY','UNIT PRICE','AMOUNT']],body:invoice.items.map((item,index)=>[String(index+1),text(item.name),String(item.quantity),invoiceMoney(item.unit_price),invoiceMoney(item.line_total)]),headStyles:{fillColor:'#f1ebfa',textColor:'#553584',fontStyle:'bold'},bodyStyles:{fillColor:false},columnStyles:{0:{cellWidth:12},1:{cellWidth:61},2:{cellWidth:16,halign:'right'},3:{cellWidth:42,halign:'right'},4:{cellWidth:43,halign:'right'}},rowPageBreak:'avoid'});
  let y=doc.lastAutoTable.finalY+8;
  if(y>235){doc.addPage();decorate();y=25;}
  autoTable(doc,{...common,startY:y,theme:'plain',margin:{...common.margin,left:105},body:[['Subtotal',invoiceMoney(invoice.subtotal)],['Total paid',invoiceMoney(invoice.total)],['Balance due',invoiceMoney(0)]],columnStyles:{0:{cellWidth:37},1:{cellWidth:50,halign:'right'}},didParseCell(data){if(data.row.index>=1){data.cell.styles.fontStyle='bold';data.cell.styles.textColor='#553584';}}});
  y=doc.lastAutoTable.finalY+9;
  if(y>253){doc.addPage();decorate();y=25;}
  doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor('#64748b');
  doc.text(['Payment received and verified through Paystack.','Product payment only. Delivery charges are arranged separately.','Thank you for shopping with Optimax.'],18,y,{lineHeightFactor:1.6});
  for(let page=1;page<=doc.getNumberOfPages();page++){
    doc.setPage(page);doc.setDrawColor('#e2e8f0');doc.setLineWidth(.2);doc.line(18,279,192,279);doc.setTextColor('#64748b');doc.setFontSize(8);doc.text(invoice.invoice_number,18,285);doc.text(`Page ${page} of ${doc.getNumberOfPages()}`,192,285,{align:'right'});
  }
  return doc;
}
