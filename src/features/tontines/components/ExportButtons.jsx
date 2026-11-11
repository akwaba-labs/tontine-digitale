import { Button, Card } from 'react-bootstrap';
import { FileDown, FileSpreadsheet } from 'lucide-react';
import { useAsyncAction } from '../../../shared/hooks/useAsyncAction';
import { exportCsv, exportPdf } from '../services/exportService';

export default function ExportButtons({ detail }) {
  const { run, isRunning } = useAsyncAction();
  return (
    <Card className="shadow-sm mb-3">
      <Card.Body>
        <h2 className="h6 fw-bold">Exporter le récapitulatif</h2>
        <p className="small text-secondary">Bilan par membre, cotisations, tours et journal.</p>
        <div className="d-flex gap-2">
          <Button
            variant="outline-primary"
            disabled={isRunning}
            onClick={() => run(() => exportPdf(detail))}
          >
            <FileDown size={18} className="me-1" aria-hidden="true" />
            PDF
          </Button>
          <Button
            variant="outline-primary"
            disabled={isRunning}
            onClick={() => run(async () => exportCsv(detail))}
          >
            <FileSpreadsheet size={18} className="me-1" aria-hidden="true" />
            CSV (Excel)
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}
