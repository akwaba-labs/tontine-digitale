import { useState } from 'react';
import { Form, Table } from 'react-bootstrap';
import { Search } from 'lucide-react';
import EmptyState from '../../../shared/components/EmptyState';
import Loader from '../../../shared/components/Loader';
import UserAvatar from '../../../shared/components/UserAvatar';
import { APP_NAME } from '../../../config/app';
import { formatDate } from '../../../shared/utils/formatDate';
import { formatPhone } from '../../../shared/utils/formatPhone';
import { getErrorMessage } from '../../../shared/utils/errorMessages';
import { listUsers } from '../services/adminService';
import { useAdminQuery } from '../components/useAdminQuery';

const normalize = (text) =>
  String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

export default function AdminUsersPage() {
  const { data: users, isLoading, error } = useAdminQuery(() => listUsers());
  const [search, setSearch] = useState('');

  if (isLoading) return <Loader />;
  if (error) return <EmptyState title="Chargement impossible" message={getErrorMessage(error)} />;

  const term = normalize(search.trim());
  const digits = term.replace(/\D/g, '');
  const visible = users.filter(
    (u) =>
      !term ||
      normalize(`${u.firstName} ${u.lastName} ${u.email}`).includes(term) ||
      (digits.length >= 2 && (u.phone ?? '').includes(digits)),
  );

  return (
    <>
      <title>{`Utilisateurs · Back-office · ${APP_NAME}`}</title>
      <div className="page-intro">
        <div>
          <h1>Utilisateurs</h1>
          <div className="page-intro__sub">{users.length} compte(s) inscrit(s)</div>
        </div>
        <div className="search-field" style={{ minWidth: '18rem' }}>
          <Search size={18} aria-hidden="true" />
          <Form.Control
            type="search"
            placeholder="Nom, e-mail ou téléphone"
            aria-label="Rechercher un utilisateur"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>
      <div className="panel p-0 overflow-hidden">
        <Table responsive hover className="admin-table mb-0">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Téléphone</th>
              <th>Inscrit le</th>
              <th>Résumé e-mail</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((u) => {
              const name = `${u.firstName} ${u.lastName}`;
              return (
                <tr key={u.id}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <UserAvatar name={name} photoURL={u.photoURL} size={34} />
                      <div className="min-w-0">
                        <div className="fw-semibold">{name}</div>
                        <div className="small text-secondary">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-nowrap">{u.phone ? formatPhone(u.phone) : '—'}</td>
                  <td className="text-nowrap">{u.createdAt ? formatDate(u.createdAt) : '—'}</td>
                  <td>
                    {u.emailNotifications === false ? (
                      <span className="admin-pill admin-pill--grey">Désactivé</span>
                    ) : (
                      <span className="admin-pill admin-pill--green">Activé</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-secondary py-4">
                  Aucun utilisateur ne correspond.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </>
  );
}
