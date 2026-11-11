import { Card, Container } from 'react-bootstrap';
import PageHeader from '../../../shared/components/PageHeader';

export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <Container className="py-4 py-md-5" style={{ maxWidth: '30rem' }}>
      <Card className="shadow-sm">
        <Card.Body className="p-4">
          <PageHeader title={title} subtitle={subtitle} />
          {children}
        </Card.Body>
      </Card>
      {footer && <div className="text-center mt-3">{footer}</div>}
    </Container>
  );
}
