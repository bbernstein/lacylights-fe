# User Mode System Plan

## Overview

LacyLights supports multiple user modes that control what actions a user can perform. This system enables different roles for different use cases: administrators managing the system, designers creating lighting, operators running shows, and observers watching without affecting anything.

## User Modes

| Mode | Description | Primary Use Case |
|------|-------------|------------------|
| **Admin** | Full system access including user management | System administrators |
| **Editor** | Can create and modify all lighting content | Lighting designers |
| **Player** | Can run shows but not modify content | Stage managers, operators |
| **Watcher** | Read-only view of all content | Observers, clients, learning |

## Permission Matrix

| Permission | Admin | Editor | Player | Watcher |
|------------|:-----:|:------:|:------:|:-------:|
| `canManageUsers` | ✓ | | | |
| `canEditContent` | ✓ | ✓ | | |
| `canPlayback` | ✓ | ✓ | ✓ | |
| `canView` | ✓ | ✓ | ✓ | ✓ |

### Permission Definitions

- **canManageUsers**: Create, edit, delete users and assign roles
- **canEditContent**: Create/edit/delete fixtures, scenes, scene boards, cue lists, and cues
- **canPlayback**: Advance cues, activate scenes, start/stop cue lists, use scene boards live
- **canView**: View all fixtures, scenes, scene boards, cue lists, and their current values

## Implementation Phases

### Phase 1: Client-Side Mode Selection (Current)

**Status:** In Progress
**Scope:** Frontend only
**Branch:** `feature/user-mode-system`

#### Goals
- Implement mode selection stored in localStorage
- Add permission checks to all mutation-triggering components
- Provide UI to switch between Editor and Watcher modes
- Design system to be forward-compatible with server-side enforcement

#### What's Implemented
- `UserMode` type enum with all four modes defined
- `UserModeContext` with permission helper booleans
- localStorage persistence of selected mode
- Permission checks in components using `canPlayback` and `canEditContent`
- UI selector for Editor ↔ Watcher toggle

#### What's Deferred
- Admin mode (no user management exists)
- Player mode UI toggle (functionally same as Editor until Phase 2)
- Server-side enforcement
- Authentication/authorization

#### Technical Details

**New Files:**
- `src/types/userMode.ts` - Type definitions and permission matrix
- `src/contexts/UserModeContext.tsx` - React context with mode + permissions
- `src/components/UserModeSelector.tsx` - UI component for mode switching

**Modified Files:**
- `src/app/providers.tsx` - Add UserModeProvider
- `src/components/CueListPlayer.tsx` - Check `canPlayback`
- `src/components/CueListEditorModal.tsx` - Check `canEditContent`
- `src/app/(main)/scene-board/[id]/SceneBoardClient.tsx` - Check both permissions
- `src/app/(main)/scenes/[sceneId]/edit/SceneEditorPageClient.tsx` - Check `canEditContent`
- `src/components/EditFixtureModal.tsx` - Check `canEditContent`
- Additional components as needed

#### Limitations
- Client-side only - a knowledgeable user could bypass via browser dev tools
- No persistent user identity - mode resets if localStorage cleared
- All modes available to anyone - no authentication required

---

### Phase 2: Player Mode Differentiation

**Status:** Planned
**Scope:** Frontend
**Prerequisites:** Phase 1 complete

#### Goals
- Enable Player mode in UI selector
- Differentiate Player from Editor in navigation and UI
- Hide editing UI elements (not just disable) for Player mode
- Optimize Player UI for show operation workflow

#### Changes
- Update `UserModeSelector` to include Player option
- Conditionally render edit buttons/menus based on `canEditContent`
- Consider simplified navigation for Player (hide Fixtures, Scene Editor, etc.)
- Add keyboard shortcuts optimized for live operation

#### UI Considerations
- Player mode should feel like a "performance console"
- Hide complexity that operators don't need
- Emphasize cue list controls and scene board buttons
- Consider full-screen / distraction-free layouts

---

### Phase 3: Server-Side Mode Enforcement

**Status:** Planned
**Scope:** Backend (lacylights-go) + Frontend
**Prerequisites:** Phase 1 complete, User authentication designed

#### Goals
- Enforce permissions at the GraphQL resolver level
- Prevent unauthorized mutations even if client is compromised
- Return appropriate errors for permission denied

#### Backend Changes (lacylights-go)

**New Components:**
- `internal/auth/permissions.go` - Permission checking functions
- `internal/middleware/auth.go` - Request authentication middleware

**Resolver Changes:**
- All mutation resolvers check permissions before executing
- Return `FORBIDDEN` error for unauthorized operations
- Queries remain accessible to all authenticated users

**Schema Changes:**
```graphql
enum UserMode {
  ADMIN
  EDITOR
  PLAYER
  WATCHER
}

type AuthContext {
  userId: ID!
  mode: UserMode!
  permissions: [String!]!
}

# Add to relevant mutations
type Mutation {
  # Existing mutations gain implicit permission checks
  nextCue(cueListId: ID!): CueListPlaybackState! @requiresPermission(permission: "canPlayback")
  updateScene(id: ID!, input: UpdateSceneInput!): Scene! @requiresPermission(permission: "canEditContent")
}
```

#### Frontend Changes
- Handle `FORBIDDEN` errors gracefully
- Show appropriate message when server rejects mutation
- Mode may be set by server based on authenticated user

#### Authentication Options
- JWT tokens with mode claim
- Session-based with mode in session data
- API keys with associated permissions
- OAuth integration with role mapping

---

### Phase 4: User Management

**Status:** Planned
**Scope:** Full stack
**Prerequisites:** Phase 3 complete

#### Goals
- Admin users can create/edit/delete other users
- Admin users can assign modes to users
- User authentication (login/logout)
- Persistent user identity

#### Backend Changes (lacylights-go)

**New Schema:**
```graphql
type User {
  id: ID!
  email: String!
  name: String!
  mode: UserMode!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Query {
  users: [User!]! @requiresPermission(permission: "canManageUsers")
  me: User
}

type Mutation {
  createUser(input: CreateUserInput!): User! @requiresPermission(permission: "canManageUsers")
  updateUser(id: ID!, input: UpdateUserInput!): User! @requiresPermission(permission: "canManageUsers")
  deleteUser(id: ID!): Boolean! @requiresPermission(permission: "canManageUsers")
  login(email: String!, password: String!): AuthPayload!
  logout: Boolean!
}

type AuthPayload {
  token: String!
  user: User!
}
```

**Database Changes:**
- `users` table with id, email, password_hash, name, mode, timestamps
- Password hashing with bcrypt or argon2
- Consider SQLite for Raspberry Pi deployments

#### Frontend Changes
- Login/logout UI
- User management admin panel
- Mode assigned by server, not localStorage
- Protected routes requiring authentication

---

### Phase 5: Multi-Device Session Management

**Status:** Future
**Scope:** Full stack
**Prerequisites:** Phase 4 complete

#### Goals
- Track active sessions across devices
- Allow admin to view/revoke sessions
- Support concurrent users with different modes
- Real-time sync of permission changes

#### Features
- Session list in admin panel
- "Log out all devices" option
- WebSocket notification of permission changes
- Automatic UI update when mode changed by admin

---

## Migration Path

### From Phase 1 to Phase 3
When server-side enforcement is added:
1. Existing localStorage mode becomes a "preference" for new users
2. Authenticated users get mode from server
3. Client-side checks become redundant but remain for UX (disable buttons before server rejects)

### From Phase 3 to Phase 4
When user management is added:
1. Initial admin user created during setup
2. Existing installations prompted to create admin account
3. Mode assignment moves from self-selection to admin assignment

---

## Security Considerations

### Phase 1 (Client-Only)
- **Risk:** Users can bypass mode restrictions via dev tools
- **Mitigation:** Acceptable for trusted environments; plan for server enforcement
- **Use Case:** Single-user or trusted team scenarios

### Phase 3+ (Server-Enforced)
- All mutations validated server-side
- Tokens/sessions have expiration
- Rate limiting on auth endpoints
- Audit logging for sensitive operations

---

## Testing Strategy

### Phase 1
- Unit tests for `UserModeContext` and permission helpers
- Component tests verifying buttons disabled in Watcher mode
- Integration tests for localStorage persistence

### Phase 3+
- Backend resolver tests for permission checks
- Integration tests for auth flow
- E2E tests for complete user journeys

---

## File Structure (All Phases)

```
lacylights-fe/
├── src/
│   ├── types/
│   │   └── userMode.ts          # Phase 1: Mode enum + permissions
│   ├── contexts/
│   │   └── UserModeContext.tsx  # Phase 1: Mode context
│   ├── components/
│   │   ├── UserModeSelector.tsx # Phase 1: Mode toggle UI
│   │   └── UserManagement/      # Phase 4: Admin panel
│   └── app/
│       └── (main)/
│           └── admin/           # Phase 4: Admin routes

lacylights-go/
├── internal/
│   ├── auth/
│   │   ├── permissions.go       # Phase 3: Permission checks
│   │   └── tokens.go            # Phase 3: JWT handling
│   ├── middleware/
│   │   └── auth.go              # Phase 3: Auth middleware
│   └── resolver/
│       └── user.go              # Phase 4: User resolvers
├── schema/
│   └── user.graphqls            # Phase 4: User schema
└── migrations/
    └── 00X_add_users.sql        # Phase 4: User table
```

---

## Progress Tracking

### Phase 1 Checklist
- [x] Create `src/types/userMode.ts`
- [x] Create `src/contexts/UserModeContext.tsx`
- [x] Create `src/components/UserModeSelector.tsx`
- [x] Update `src/app/providers.tsx`
- [x] Add permission checks to `CueListPlayer.tsx`
- [x] Add permission checks to `CueListEditorModal.tsx`
- [x] Add permission checks to `SceneBoardClient.tsx`
- [ ] Add permission checks to scene editor (deferred)
- [ ] Add permission checks to fixture editor (deferred)
- [x] Add unit tests for UserModeContext
- [x] Add unit tests for userMode types
- [x] Update test files for new context dependency
- [x] Update documentation

---

## References

- `docs/RASPBERRY_PI_PRODUCT_PLAN.md` - Hardware product context
- `src/contexts/FocusModeContext.tsx` - Pattern reference for context implementation
- `src/hooks/useScrollDirectionPreference.ts` - Pattern reference for localStorage
