export const friendsView = `
<section class="p-6 max-w-4xl">
  <h1 class="text-3xl font-semibold mb-4">My friends</h1>

    <div class="flex-grow space-y-4">
      <table class="text-left w-full">
        <tbody>
          <tr>
            <td class="table-cell-label">Login</td>
            <td class="table-cell-input">
              <input name="login" class="input" readonly />
            </td>
          </tr>
          <tr>
            <td class="table-cell-label">Email</td>
            <td class="table-cell-input">
              <input name="email" class="input" readonly />
            </td>
          </tr>
          <tr>
            <td class="table-cell-label">Password</td>
            <td class="table-cell-input">
              <input
                name="password"
                type="password"
                class="input"
                placeholder="••••••"
                readonly
              />
            </td>
          </tr>
        </tbody>
      </table>

      <div class="flex gap-4">
        <button id="edit-btn"   type="button" class="btn-primary w-24">Edit</button>
        <button id="save-btn"   type="button" class="btn-primary w-24 hidden">Save</button>
        <button id="cancel-btn" type="button" class="btn-secondary w-24 hidden">Cancel</button>
      </div>

      <span id="status" class="text-sm text-gray-500"></span>
    </div>
  </div>
</section>
`;


