# Datasource Documentation

The Datasource functionality allows users to manage external data storage and API connections for their AI agents. These datasources are used by the FundingDetective agent to retrieve and process information.

## API Endpoints

All requests must be sent to the Agent base URL (`VITE_AGENT_BASE_URL`) and require JWT authentication. State-changing methods (POST, PUT, DELETE) require a valid CSRF token.

### `GET /datasources`
Lists all data sources for the user.
- **Query Params**: `process_id` (optional, filter by process ID).
- **Response**: `DataSource[]` (List of data source objects).

### `POST /datasources`
Creates a new data source.
- **Body**:
  ```json
  {
    "process_id": "default",
    "platform": "google_drive",
    "resource_identifier": "project_alpha",
    "config": [ ... ]
  }
  ```
- **Response**: `{"msg": "Data source created", "id": "<mongo_id>"}` (Status 201)

### `GET /datasources/<id>`
Retrieves a specific data source.
- **Path Param**: `<id>` (MongoDB ObjectID as string).
- **Response**: `DataSource` object.

### `PUT /datasources/<id>`
Updates an existing data source.
- **Path Param**: `<id>` (MongoDB ObjectID as string).
- **Body**: `{"resource_identifier": "project_beta", "config": [ ... ]}`
- **Response**: `{"msg": "Data source updated"}`

### `DELETE /datasources/<id>`
Deletes a data source.
- **Path Param**: `<id>` (MongoDB ObjectID as string).
- **Response**: `{"msg": "Data source deleted"}`

---

## Data Structures

### DataSource
```typescript
interface DataSource {
  id: string;               // MongoDB ObjectID
  process_id: string;       // Associated process ID (e.g., "default")
  platform: 'google_drive' | 'sharepoint' | 'external_api';
  resource_identifier: string;
  config: DataSourceConfig[];
  created_at: string;
  updated_at: string;
}
```

### DataSourceConfig
The `config` field must be an array of objects with the following structure:
```json
[
  {
    "name": "string",
    "query_url": "string",
    "download_url": "string",
    "payload": {
      "estadoAvisoId": number,
      "page": number
    }
  }
]
```

---

## Frontend Implementation

### Service
Located in `services/api.ts`, the `dataSourcesService` uses `agentApiClient` to communicate with the Agent service.

### Components
- **`Agent.tsx`**: Contains the management UI, including the list of configured sources and the "Add Datasource" slide-over modal.
- **Default Config**: When adding a new datasource, the `config` field is pre-populated with the required structure to guide the user.

---

## Security
- **Authentication**: JWT-based, handled via `withCredentials: true` and HttpOnly cookies.
- **CSRF**: Double-submit cookie pattern. Interceptors automatically inject the `X-CSRF-Token` header.
- **Validation**: Frontend validates that `resource_identifier` is present and `config` is valid JSON.
