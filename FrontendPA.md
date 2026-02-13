# FrontendPA

Este documento resume as alterações que fizemos no frontend e, em especial, como remover o modo DEV com os botões **Entrar como User/Admin**.

## 1) O que foi feito

## Landing/Home
- Criada/ativada a `Home` com estilo premium escuro:
  - `pages/Home.tsx`
  - `styles/Home.css`
- A rota inicial deixou de redirecionar diretamente para login:
  - `App.tsx` (`Route index` agora renderiza `<Home />`).
- Na Home, o botão `TOUCH THE FUTURE` navega para `/#/login`.

## Login e Register
- Uniformização visual entre login e registo no mesmo tema preto:
  - `pages/Login.tsx`
  - `pages/Register.tsx`
- Ajustes em layout/navbar para manter o visual consistente nas páginas de auth:
  - `components/Layout.tsx`
  - `components/Navbar.tsx`

## Dashboard (após login)
- O `Dashboard` foi reestruturado para o novo visual (header, cards, grid, glow/noise):
  - `pages/Dashboard.tsx`
  - `styles/Dashboard.css`
- O `Layout` foi ajustado para deixar o `Dashboard` em modo standalone (sem sidebar/navbar/footer nessa rota):
  - `components/Layout.tsx`

## Tema unificado das páginas autenticadas
- Criado tema global visual para páginas protegidas (cor, cards, inputs, tabelas):
  - `styles/AuthAppTheme.css`
- Integrado no layout:
  - `components/Layout.tsx`
- `Navbar` e `Sidebar` também adaptadas ao mesmo estilo:
  - `components/Navbar.tsx`
  - `components/Sidebar.tsx`

## Importante sobre backend
- **Não alterámos endpoints nem lógica de API/backend.**
- As mudanças foram de UI/UX e estado local de sessão DEV.

---

## 2) Modo DEV (botões User/Admin) - o que é

Foi adicionado um bypass de autenticação **apenas em desenvolvimento** (`import.meta.env.DEV`):

- Botões na Home:
  - `Entrar como User`
  - `Entrar como Admin`
- Ao clicar, grava em `localStorage` a role (`dev_session_role`) e entra no dashboard sem login real.

Arquivos envolvidos:
- `pages/Home.tsx`
- `context/AuthContext.tsx`
- `styles/Home.css`

---

## 3) O que apagar para remover os botões User/Admin

Se quiseres remover totalmente esse modo DEV, apaga estes blocos:

## A) Em `pages/Home.tsx`
1. Remover import:
```ts
import { useAuth } from '../context/AuthContext';
```
2. Remover:
```ts
const { checkAuth } = useAuth();
const isDevMode = import.meta.env.DEV;
```
3. Remover função:
```ts
const handleDevAccess = async (role: 'user' | 'admin') => {
  localStorage.setItem('dev_session_role', role);
  await checkAuth();
  navigate('/dashboard');
};
```
4. Remover bloco JSX:
```tsx
{isDevMode && (
  <div className="dev-access">
    <p className="dev-access__label">DEV MODE</p>
    <div className="dev-access__actions">
      <button type="button" className="dev-btn" onClick={() => handleDevAccess('user')}>
        Entrar como User
      </button>
      <button type="button" className="dev-btn" onClick={() => handleDevAccess('admin')}>
        Entrar como Admin
      </button>
    </div>
  </div>
)}
```

## B) Em `context/AuthContext.tsx`
1. Remover constantes/funções DEV:
```ts
const DEV_SESSION_ROLE_KEY = 'dev_session_role';
const isDevSessionRole = ...
const buildDevUser = ...
```
2. Remover bloco DEV dentro de `checkAuth()`:
```ts
if (import.meta.env.DEV) {
  const devRole = localStorage.getItem(DEV_SESSION_ROLE_KEY);
  if (isDevSessionRole(devRole)) {
    setUser(buildDevUser(devRole));
    setStatus(AuthStatus.AUTHENTICATED);
    return;
  }
}
```
3. Em `logout()`, remover esta linha:
```ts
localStorage.removeItem(DEV_SESSION_ROLE_KEY);
```

## C) Em `styles/Home.css`
Remover classes:
- `.dev-access`
- `.dev-access__label`
- `.dev-access__actions`
- `.dev-btn`
- `.dev-btn:hover`

---

## 4) Alternativa rápida (sem apagar código)

Se quiseres apenas esconder os botões sem remover código, em `pages/Home.tsx` troca:
```ts
const isDevMode = import.meta.env.DEV;
```
por:
```ts
const isDevMode = false;
```

---

## 5) Estado final esperado sem modo DEV

- Entrada normal:
  - `/#/` -> Home
  - `TOUCH THE FUTURE` -> `/#/login`
  - login real -> páginas protegidas
- Sem botões `Entrar como User/Admin`.

