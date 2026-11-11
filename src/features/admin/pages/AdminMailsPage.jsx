import { useState } from 'react';
import { Modal, Table } from 'react-bootstrap';
import EmptyState from '../../../shared/components/EmptyState';
import Loader from '../../../shared/components/Loader';
import { APP_NAME } from '../../../config/app';
import { formatDateTime } from '../../../shared/utils/formatDate';
import { getErrorMessage } from '../../../shared/utils/errorMessages';
import { listMailLog } from '../services/adminService';
import { useAdminQuery } from '../components/useAdminQuery';

const STATUS = {
  SENT: ['Envoyé', 'green'],
  SIMULATED: ['Simulé', 'blue'],
  FAILED: ['Échec', 'red'],
  PENDING: ['En cours', 'grey'],
};

export default function AdminMailsPage() {
  const { data: mails, isLoading, error } = useAdminQuery(() => listMailLog());
  const [opened, setOpened] = useState(null);

  if (isLoading) return <Loader />;
  if (error) return <EmptyState title="Chargement impossible" message={getErrorMessage(error)} />;

  return (
    <>
      <title>{`E-mails · Back-office · ${APP_NAME}`}</title>
      <div className="page-intro">
        <div>
          <h1>E-mails</h1>
          <div className="page-intro__sub">
            Résumés quotidiens envoyés chaque soir à 19 h · {mails.length} dernier(s)
          </div>
        </div>
      </div>
      {mails.length === 0 ? (
        <EmptyState
          title="Aucun e-mail pour l’instant"
          message="Le premier résumé quotidien partira ce soir à 19 h s’il y a de l’activité. En local : npm run digest."
        />
      ) : (
        <div className="panel p-0 overflow-hidden">
          <Table responsive hover className="admin-table mb-0">
            <thead>
              <tr>
                <th>Date</th>
                <th>Destinataire</th>
                <th>Objet</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {mails.map((mail) => {
                const [label, tone] = STATUS[mail.status] ?? [mail.status, 'grey'];
                return (
                  <tr
                    key={mail.id}
                    className={mail.text ? 'cursor-pointer' : ''}
                    onClick={() => mail.text && setOpened(mail)}
                  >
                    <td className="text-nowrap">
                      {mail.createdAt ? formatDateTime(mail.createdAt) : '—'}
                    </td>
                    <td>{mail.to}</td>
                    <td>
                      {mail.subject}
                      {mail.error && <div className="small text-danger">{mail.error}</div>}
                    </td>
                    <td>
                      <span className={`admin-pill admin-pill--${tone}`}>{label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      )}
      <Modal show={Boolean(opened)} onHide={() => setOpened(null)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title as="h2" className="h5">
            {opened?.subject}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="small text-secondary mb-2">À : {opened?.to}</div>
          <pre className="mail-preview">{opened?.text}</pre>
        </Modal.Body>
      </Modal>
    </>
  );
}
