export function getPostmanHubHtml(baseUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AURA // Postman API Documentation</title>
  <style>
    :root {
      --bg: #09090b;
      --card-bg: #121215;
      --card-hover: #18181b;
      --border: #27272a;
      --border-subtle: #1f1f23;
      --text: #fafafa;
      --text-muted: #a1a1aa;
      --accent: #ffffff;
      --accent-badge: #27272a;
      --method-get: #a1a1aa;
      --method-post: #ffffff;
      --method-patch: #d4d4d8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.5;
      padding: 32px 16px;
    }
    .container {
      max-width: 1040px;
      margin: 0 auto;
    }
    header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 32px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      background: #ffffff;
      color: #000000;
      font-weight: 800;
      border-radius: 6px;
      font-size: 18px;
    }
    .title {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 9999px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      font-size: 0.75rem;
      font-family: monospace;
      color: var(--text-muted);
    }
    .status-dot {
      width: 7px;
      height: 7px;
      background: #22c55e;
      border-radius: 50%;
    }
    .hero {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 28px;
      margin-bottom: 28px;
    }
    .hero h1 {
      font-size: 1.75rem;
      font-weight: 700;
      letter-spacing: -0.025em;
      margin-bottom: 8px;
    }
    .hero p {
      color: var(--text-muted);
      font-size: 0.95rem;
      max-width: 680px;
      margin-bottom: 24px;
    }
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }
    .action-box {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
    }
    .action-title {
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 8px;
      font-weight: 600;
    }
    .url-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #000000;
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 6px 10px;
      font-family: monospace;
      font-size: 0.85rem;
      color: #e4e4e7;
    }
    .copy-btn {
      background: #ffffff;
      color: #000000;
      border: none;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: opacity 0.2s;
    }
    .copy-btn:hover { opacity: 0.9; }
    .btn-group {
      display: flex;
      gap: 8px;
      margin-top: 10px;
    }
    .download-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      color: var(--text);
      text-decoration: none;
      border-radius: 6px;
      font-size: 0.82rem;
      font-weight: 500;
      transition: background 0.2s, border-color 0.2s;
    }
    .download-link:hover {
      background: var(--card-hover);
      border-color: #52525b;
    }
    .section-title {
      font-size: 1.1rem;
      font-weight: 600;
      letter-spacing: -0.01em;
      margin: 32px 0 16px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .table-wrapper {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 24px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
      text-align: left;
    }
    th {
      background: #0e0e11;
      padding: 10px 16px;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border);
      font-weight: 600;
    }
    td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-subtle);
    }
    tr:last-child td { border-bottom: none; }
    .method {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 0.72rem;
      font-weight: 700;
      font-family: monospace;
      border: 1px solid var(--border);
    }
    .method-GET { background: #18181b; color: #a1a1aa; }
    .method-POST { background: #ffffff; color: #000000; }
    .method-PATCH { background: #27272a; color: #f4f4f5; }
    .path { font-family: monospace; font-size: 0.84rem; color: #fafafa; }
    .role-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.72rem;
      background: #18181b;
      border: 1px solid var(--border);
      color: #d4d4d8;
    }
    footer {
      margin-top: 48px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
      text-align: center;
      color: var(--text-muted);
      font-size: 0.8rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <div class="logo">+</div>
        <div>
          <div class="title">AURA // API Documentation Hub</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Swagger OpenAPI & Postman Collection Live</div>
        </div>
      </div>
      <div class="badge">
        <span class="status-dot"></span>
        <span>BACKEND API ONLINE (PORT 4000)</span>
      </div>
    </header>

    <div class="hero">
      <h1>Hospital Management API Documentation</h1>
      <p>
        Explore interactive Swagger OpenAPI 3.0 documentation with live execution, or import our pre-configured collection into Postman to test role-based authentication, appointments, digital prescriptions, pharmacy inventory, and billing.
      </p>

      <div class="actions-grid">
        <div class="action-box">
          <div class="action-title">1. Interactive Swagger UI</div>
          <div class="btn-group">
            <a href="/api/docs/swagger" class="download-link" style="background: #ffffff; color: #000000; font-weight: 700;">
              📖 Launch Swagger OpenAPI UI
            </a>
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 8px;">
            Test endpoints with Bearer tokens directly in your browser.
          </div>
        </div>

        <div class="action-box">
          <div class="action-title">2. One-Click Import in Postman</div>
          <div class="url-bar">
            <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" id="importUrl">${baseUrl}/api/docs</span>
            <button class="copy-btn" onclick="copyUrl()">Copy URL</button>
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 8px;">
            In Postman: Click <strong>Import</strong> (Ctrl + O) ➔ Paste this URL.
          </div>
        </div>

        <div class="action-box">
          <div class="action-title">3. Download Files Directly</div>
          <div class="btn-group">
            <a href="/api/docs/collection" class="download-link">
              📥 Collection (.json)
            </a>
            <a href="/api/docs/environment" class="download-link">
              ⚙️ Environment (.json)
            </a>
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 8px;">
            Includes automatic token auto-saving on login requests.
          </div>
        </div>
      </div>
    </div>

    <div class="section-title">👥 Pre-Seeded Role Credentials</div>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Role</th>
            <th>Email</th>
            <th>Password</th>
            <th>Primary Capabilities</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="role-badge">ADMIN</span></td>
            <td><code>admin@hospital.com</code></td>
            <td><code>Hospital123!</code></td>
            <td>User management, account status toggling, billing invoices</td>
          </tr>
          <tr>
            <td><span class="role-badge">DOCTOR</span></td>
            <td><code>doctor.smith@hospital.com</code></td>
            <td><code>Hospital123!</code></td>
            <td>Appointments, issuing digital prescriptions, viewing patients</td>
          </tr>
          <tr>
            <td><span class="role-badge">PHARMACIST</span></td>
            <td><code>pharmacist.alex@hospital.com</code></td>
            <td><code>Hospital123!</code></td>
            <td>Dispensing prescriptions, medicine stock & inventory control</td>
          </tr>
          <tr>
            <td><span class="role-badge">PATIENT</span></td>
            <td><code>patient.jane@example.com</code></td>
            <td><code>Hospital123!</code></td>
            <td>Booking consultations, viewing personal medical profile & bills</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section-title">📑 API Endpoints Catalog</div>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>Endpoint</th>
            <th>Allowed Roles</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="method method-POST">POST</span></td>
            <td class="path">/api/v1/auth/login</td>
            <td>Public</td>
            <td>Authenticates user and returns JWT access token</td>
          </tr>
          <tr>
            <td><span class="method method-POST">POST</span></td>
            <td class="path">/api/v1/auth/register</td>
            <td>Public</td>
            <td>Registers a new hospital patient or staff account</td>
          </tr>
          <tr>
            <td><span class="method method-GET">GET</span></td>
            <td class="path">/api/v1/auth/me</td>
            <td>All Roles</td>
            <td>Returns current authenticated user profile</td>
          </tr>
          <tr>
            <td><span class="method method-GET">GET</span></td>
            <td class="path">/api/v1/health</td>
            <td>Public</td>
            <td>Database connection and system health ping</td>
          </tr>
          <tr>
            <td><span class="method method-GET">GET</span></td>
            <td class="path">/api/v1/users</td>
            <td>ADMIN</td>
            <td>List all registered hospital staff and patients</td>
          </tr>
          <tr>
            <td><span class="method method-PATCH">PATCH</span></td>
            <td class="path">/api/v1/users/:id/status</td>
            <td>ADMIN</td>
            <td>Activate or deactivate a user account</td>
          </tr>
          <tr>
            <td><span class="method method-GET">GET</span></td>
            <td class="path">/api/v1/doctors</td>
            <td>Public</td>
            <td>List all doctors, departments, and consultation fees</td>
          </tr>
          <tr>
            <td><span class="method method-GET">GET</span></td>
            <td class="path">/api/v1/patients</td>
            <td>ADMIN, DOCTOR</td>
            <td>List authorized patients</td>
          </tr>
          <tr>
            <td><span class="method method-GET">GET</span></td>
            <td class="path">/api/v1/patients/me</td>
            <td>PATIENT</td>
            <td>Patient self-service: medical records, visits, and bills</td>
          </tr>
          <tr>
            <td><span class="method method-POST">POST</span></td>
            <td class="path">/api/v1/appointments</td>
            <td>ADMIN, PATIENT</td>
            <td>Schedule a consultation with a doctor</td>
          </tr>
          <tr>
            <td><span class="method method-GET">GET</span></td>
            <td class="path">/api/v1/appointments</td>
            <td>ADMIN, DOCTOR, PATIENT</td>
            <td>List appointments scoped by caller role</td>
          </tr>
          <tr>
            <td><span class="method method-PATCH">PATCH</span></td>
            <td class="path">/api/v1/appointments/:id/status</td>
            <td>ADMIN, DOCTOR</td>
            <td>Update appointment status (CONFIRMED, COMPLETED, etc.)</td>
          </tr>
          <tr>
            <td><span class="method method-POST">POST</span></td>
            <td class="path">/api/v1/prescriptions</td>
            <td>DOCTOR</td>
            <td>Doctor issues digital prescription with medication courses</td>
          </tr>
          <tr>
            <td><span class="method method-PATCH">PATCH</span></td>
            <td class="path">/api/v1/prescriptions/:id/dispense</td>
            <td>PHARMACIST</td>
            <td>Pharmacist fulfills and marks prescription as dispensed</td>
          </tr>
          <tr>
            <td><span class="method method-GET">GET</span></td>
            <td class="path">/api/v1/pharmacy/medicines</td>
            <td>ADMIN, DOCTOR, PHARMACIST</td>
            <td>Browse pharmacy stock inventory and batch details</td>
          </tr>
          <tr>
            <td><span class="method method-POST">POST</span></td>
            <td class="path">/api/v1/pharmacy/medicines</td>
            <td>ADMIN, PHARMACIST</td>
            <td>Add a new medicine batch to pharmacy stock</td>
          </tr>
          <tr>
            <td><span class="method method-PATCH">PATCH</span></td>
            <td class="path">/api/v1/pharmacy/medicines/:id/stock</td>
            <td>ADMIN, PHARMACIST</td>
            <td>Adjust stock quantity for medicine item</td>
          </tr>
          <tr>
            <td><span class="method method-GET">GET</span></td>
            <td class="path">/api/v1/billing</td>
            <td>ADMIN, PATIENT</td>
            <td>List medical bills and payment receipts</td>
          </tr>
          <tr>
            <td><span class="method method-POST">POST</span></td>
            <td class="path">/api/v1/billing</td>
            <td>ADMIN</td>
            <td>Generate an itemized invoice</td>
          </tr>
          <tr>
            <td><span class="method method-PATCH">PATCH</span></td>
            <td class="path">/api/v1/billing/:id/pay</td>
            <td>ADMIN</td>
            <td>Record payment against invoice</td>
          </tr>
        </tbody>
      </table>
    </div>

    <footer>
      AURA Hospital Management System &bull; Postman API Integration &bull; Powered by NestJS &amp; MongoDB
    </footer>
  </div>

  <script>
    function copyUrl() {
      const urlText = document.getElementById('importUrl').innerText;
      navigator.clipboard.writeText(urlText).then(() => {
        const btn = document.querySelector('.copy-btn');
        const orig = btn.innerText;
        btn.innerText = 'Copied!';
        setTimeout(() => { btn.innerText = orig; }, 2000);
      });
    }
  </script>
</body>
</html>`;
}
