"use client";

import { useActionState, useState } from "react";
import { createUserAction, updateUserAction, type UserActionState } from "@/app/actions/admin-users";

type UserRow = { user_id: string; display_name: string; role: "admin" | "staff" | "client"; is_active: boolean; force_password_change: boolean; email: string; created_at: string };
const emptyState: UserActionState = { error: "", success: "" };

export function UserManager({ users, currentUserId }: { users: UserRow[]; currentUserId: string }) {
  const [createState, createAction, creating] = useActionState(createUserAction, emptyState);
  const [showCreate, setShowCreate] = useState(false);
  return <div className="admin-users-layout">
    <section className="admin-panel-card"><div><h2>Adicionar conta</h2><p>As contas são criadas pela equipe; não existe seleção de função na tela de login.</p></div><button className="button button-primary" type="button" onClick={() => setShowCreate((value) => !value)}>{showCreate ? "Fechar" : "Criar usuário +"}</button></section>
    {showCreate ? <form action={createAction} className="admin-product-form admin-create-user"><h2>Novo usuário</h2><div className="admin-form-grid"><label className="form-field">Nome<input name="display_name" required minLength={2} /></label><label className="form-field">E-mail<input name="email" type="email" required /></label><label className="form-field">Função<select name="role" defaultValue="staff"><option value="staff">Funcionário</option><option value="admin">Administrador</option><option value="client">Cliente</option></select></label><label className="form-field">Senha temporária<input name="password" type="password" required minLength={8} autoComplete="new-password" /><small>Use ao menos 8 caracteres. O usuário poderá alterá-la na área Minha conta.</small></label></div>{createState.error ? <p className="form-error" role="alert">{createState.error}</p> : null}{createState.success ? <p className="admin-success" role="status">{createState.success}</p> : null}<button className="button button-primary" disabled={creating}>{creating ? "Criando…" : "Criar conta"}</button></form> : null}
    <section className="admin-table-wrap"><h2 className="admin-table-title">Contas cadastradas <span>{users.length}</span></h2><table className="admin-table"><thead><tr><th>Usuário</th><th>Função</th><th>Status</th><th>Cadastro</th><th></th></tr></thead><tbody>{users.map((user) => <UserEditRow key={user.user_id} user={user} currentUserId={currentUserId} />)}</tbody></table>{!users.length ? <p className="admin-empty">Nenhuma conta de perfil foi encontrada.</p> : null}</section>
  </div>;
}

function UserEditRow({ user, currentUserId }: { user: UserRow; currentUserId: string }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(updateUserAction, emptyState);
  return <tr><td>{editing ? <><form id={`update-${user.user_id}`} action={action} className="admin-user-edit"><input type="hidden" name="user_id" value={user.user_id} /><label className="form-field">Nome<input name="display_name" defaultValue={user.display_name} required minLength={2} /></label><label className="form-field">E-mail<input name="email" type="email" defaultValue={user.email} required /></label></form></> : <><strong>{user.display_name}</strong><small>{user.email}</small></>}{user.force_password_change ? <small className="admin-warning-text">Troca de senha pendente</small> : null}{state.error ? <small className="form-error">{state.error}</small> : null}{state.success ? <small className="admin-success">{state.success}</small> : null}</td><td>{editing ? <div className="admin-user-edit"><select name="role" form={`update-${user.user_id}`} defaultValue={user.role}><option value="staff">Funcionário</option><option value="admin">Administrador</option><option value="client">Cliente</option></select><label className="admin-check"><input type="checkbox" name="is_active" form={`update-${user.user_id}`} defaultChecked={user.is_active} disabled={user.user_id === currentUserId} /> Ativo</label></div> : roleLabel(user.role)}</td><td><span className={`admin-status ${user.is_active ? "is-on" : "is-off"}`}>{user.is_active ? "Ativo" : "Inativo"}</span></td><td>{new Date(user.created_at).toLocaleDateString("pt-BR")}</td><td>{editing ? <div className="admin-row-actions"><button form={`update-${user.user_id}`} className="admin-edit-link" type="submit" disabled={pending}>{pending ? "Salvando…" : "Salvar"}</button><button className="admin-edit-link" type="button" onClick={() => setEditing(false)}>Cancelar</button></div> : <button className="admin-edit-link" type="button" onClick={() => setEditing(true)}>Editar</button>}</td></tr>;
}

function roleLabel(role: string) { return role === "admin" ? "Administrador" : role === "staff" ? "Funcionário" : "Cliente"; }
