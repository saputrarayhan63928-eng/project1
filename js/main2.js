(function(){
    const API_BASE = 'https://dummyjson.com/todos';
    // Elements
    const todoListEl = document.getElementById('todoList');
    const statTotal = document.getElementById('statTotal');
    const statCompleted = document.getElementById('statCompleted');
    const statPending = document.getElementById('statPending');
    const statUsers = document.getElementById('statUsers');
    const formAdd = document.getElementById('formAdd');
    const newTodoInput = document.getElementById('newTodoInput');
    const refreshBtn = document.getElementById('refreshBtn');
    const addSampleBtn = document.getElementById('addSampleBtn');
    const searchInput = document.getElementById('search');
    const filterSelect = document.getElementById('filter');
    const sortSelect = document.getElementById('sort');
    const clearLocalBtn = document.getElementById('clearLocal');
    const readme = document.getElementById('readme');

   
    let todos = []; 
    let overrides = {
      created: [], // newly created items returned by POST
      updated: {}, // id -> updated object
      deleted: new Set() // ids flagged deleted
    };

    // ---------- Utility helpers ----------
    const byId = (id) => todos.find(t => Number(t.id) === Number(id));
    const showError = (msg) => alert(msg);
    const formatCount = (n) => String(n);

    // fetch all todos (limit=0 to get all)
    async function fetchTodos(){
      try{
        const res = await fetch(API_BASE + '?limit=0');
        if(!res.ok) throw new Error('Gagal fetch todos: ' + res.status);
        const data = await res.json();
        // data.todos is array
        todos = Array.isArray(data.todos) ? data.todos.slice() : [];
        // merge local overrides (so client shows created/updated/deleted across session)
        // remove deleted
        todos = todos.filter(t => !overrides.deleted.has(Number(t.id)));
        // append created ones at top
        if(overrides.created.length) {
          todos = overrides.created.concat(todos);
        }
        // apply updates map
        todos = todos.map(t => overrides.updated[t.id] ? {...t, ...overrides.updated[t.id]} : t);
        render();
      }catch(err){
        console.error(err);
        showError('Error fetch todos. Lihat console.');
      }
    }

    // render list & stats
    function render(){
      // apply search/filter/sort on a copy
      const query = (searchInput.value || '').toLowerCase().trim();
      const filter = filterSelect.value;
      const sort = sortSelect.value;

      let list = todos.slice();

      if(query){
        list = list.filter(t => (t.todo || '').toLowerCase().includes(query));
      }
      if(filter === 'completed') list = list.filter(t => Boolean(t.completed));
      if(filter === 'pending') list = list.filter(t => !t.completed);

      // sort
      switch(sort){
        case 'id_asc': list.sort((a,b)=>a.id - b.id); break;
        case 'id_desc': list.sort((a,b)=>b.id - a.id); break;
        case 'alpha_asc': list.sort((a,b)=> (a.todo || '').localeCompare(b.todo || '')); break;
        case 'alpha_desc': list.sort((a,b)=> (b.todo || '').localeCompare(a.todo || '')); break;
      }

      // render list DOM
      todoListEl.innerHTML = '';
      if(!list.length) {
        todoListEl.innerHTML = '<li class="todo"><div class="left"><div class="todo-text">Tidak ada tasks</div></div></li>';
      } else {
        const frag = document.createDocumentFragment();
        for(const t of list){
          const li = document.createElement('li');
          li.className = 'todo' + (t.completed ? ' completed' : '');
          li.dataset.id = t.id;

          li.innerHTML = `
            <div class="left">
              <input type="checkbox" class="toggle" ${t.completed ? 'checked' : ''} />
              <div style="min-width:0">
                <div class="todo-text" title="${escapeHtml(t.todo || '')}">${escapeHtml(t.todo || '')}</div>
                <div class="small" style="margin-top:6px;color:var(--muted)">User: <span class="badge">${t.userId ?? '-'}</span> • Id: ${t.id}</div>
              </div>
            </div>
            <div class="actions">
              <button class="btn-small btn-edit" data-action="edit">✏️</button>
              <button class="btn-small" data-action="delete">🗑️</button>
            </div>
          `;
          frag.appendChild(li);
        }
        todoListEl.appendChild(frag);
      }

      // stats
      const total = todos.length;
      const completed = todos.filter(t => t.completed).length;
      const pending = total - completed;
      const users = new Set(todos.map(t => t.userId)).size;

      statTotal.textContent = 'Total: ' + formatCount(total);
      statCompleted.textContent = 'Selesai: ' + formatCount(completed);
      statPending.textContent = 'Belum: ' + formatCount(pending);
      statUsers.textContent = 'Users unik: ' + formatCount(users);
    }

    // escape html for safety in rendering
    function escapeHtml(str){
      return String(str).replace(/[&<>"']/g, function(m){
        return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];
      });
    }

    // ---------- CRUD actions (using Fetch API) ----------
    async function createTodo(payload){
      // payload: { todo, completed, userId }
      try{
        const res = await fetch(API_BASE + '/add', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(payload)
        });
        if(!res.ok) throw new Error('Create failed: ' + res.status);
        const created = await res.json();
        // DummyJSON returns created object (server-side simulation). Save in local override so UI keeps it.
        overrides.created.unshift(created);
        // add to todos list
        todos.unshift(created);
        render();
        return created;
      }catch(err){
        console.error(err);
        showError('Gagal menambah todo (lihat console).');
      }
    }

    async function updateTodo(id, patch){
      // patch: partial object fields e.g. { completed: true } or { todo: 'new text' }
      try{
        const res = await fetch(API_BASE + '/' + id, {
          method: 'PUT', // or PATCH
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(patch)
        });
        if(!res.ok) throw new Error('Update failed: ' + res.status);
        const updated = await res.json();
        // save override for persistence in this session
        overrides.updated[updated.id] = updated;
        // update local array
        todos = todos.map(t => t.id == updated.id ? {...t, ...updated} : t);
        render();
        return updated;
      }catch(err){
        console.error(err);
        showError('Gagal update todo.');
      }
    }

    async function deleteTodo(id){
      try{
        const res = await fetch(API_BASE + '/' + id, { method: 'DELETE' });
        if(!res.ok) throw new Error('Delete failed: ' + res.status);
        const info = await res.json();
        // mark as deleted locally so it disappears
        overrides.deleted.add(Number(id));
        // also remove from overrides.created if present
        overrides.created = overrides.created.filter(c => c.id != id);
        // remove updated override too
        delete overrides.updated[id];
        // update local list
        todos = todos.filter(t => t.id != id);
        render();
        return info;
      }catch(err){
        console.error(err);
        showError('Gagal menghapus todo.');
      }
    }

    // ---------- Event handling (DOM) ----------
    // Add form submit
    formAdd.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = (newTodoInput.value || '').trim();
      if(!text) return;
      // pick userId randomly for demo
      const userId = Math.floor(Math.random()*10) + 1;
      const created = await createTodo({ todo: text, completed: false, userId });
      if(created) {
        newTodoInput.value = '';
      }
    });

    // Refresh button
    refreshBtn.addEventListener('click', fetchTodos);

    // Add sample quick todo
    addSampleBtn.addEventListener('click', async () => {
      const samples = [
        'Belajar JavaScript 30 menit',
        'Baca dokumentasi API',
        'Kerjakan tugas kecil',
        'Refactor UI',
        'Push project ke repo'
      ];
      const text = samples[Math.floor(Math.random()*samples.length)];
      await createTodo({ todo: text, completed: false, userId: Math.floor(Math.random()*20)+1 });
    });

    // Search / filter / sort change
    [searchInput, filterSelect, sortSelect].forEach(el => el.addEventListener('input', render));

    // Clear client overrides (reset local session)
    clearLocalBtn.addEventListener('click', () => {
      if(!confirm('Reset perubahan local (created/updated/deleted) di session ini?')) return;
      overrides = { created: [], updated: {}, deleted: new Set() };
      fetchTodos();
    });

    // Event delegation for todo actions
    todoListEl.addEventListener('click', async (ev) => {
      const li = ev.target.closest('li.todo');
      if(!li) return;
      const id = li.dataset.id;
      const action = ev.target.dataset.action || (ev.target.classList.contains('toggle') ? 'toggle' : null);

      if(action === 'delete'){
        if(confirm('Hapus todo ini?')) {
          await deleteTodo(id);
        }
        return;
      }

      if(action === 'edit'){
        enterEditMode(li, id);
        return;
      }

      if(ev.target.classList.contains('toggle') || action === 'toggle'){
        const checked = ev.target.checked;
        // optimistically update UI
        li.classList.toggle('completed', checked);
        try{
          await updateTodo(id, { completed: checked });
        }catch(e){
          // nothing; error already handled in updateTodo
        }
        return;
      }
    });

    // Inline edit: double-click text to edit OR via edit button
    function enterEditMode(li, id){
      const t = byId(id);
      if(!t) return;
      const textEl = li.querySelector('.todo-text');
      const original = t.todo || '';
      // replace content with input + save/cancel
      const editor = document.createElement('div');
      editor.style.display = 'flex';
      editor.style.gap = '8px';
      editor.style.alignItems = 'center';
      editor.style.width = '100%';

      const input = document.createElement('input');
      input.className = 'edit-input';
      input.value = original;
      input.autofocus = true;

      const btnSave = document.createElement('button');
      btnSave.className = 'btn-small';
      btnSave.textContent = 'Save';

      const btnCancel = document.createElement('button');
      btnCancel.className = 'btn-small';
      btnCancel.textContent = 'Cancel';

      editor.appendChild(input);
      editor.appendChild(btnSave);
      editor.appendChild(btnCancel);

      textEl.replaceWith(editor);

      btnCancel.addEventListener('click', () => {
        editor.replaceWith(renderTextDiv(original));
      });

      btnSave.addEventListener('click', async () => {
        const val = (input.value || '').trim();
        if(!val){ alert('Teks tidak boleh kosong'); return; }
        try{
          await updateTodo(id, { todo: val });
          // updated via render triggered inside updateTodo
        }catch(e){
          // error handled inside updateTodo
        }
      });

      input.addEventListener('keydown', (e) => {
        if(e.key === 'Enter') btnSave.click();
        if(e.key === 'Escape') btnCancel.click();
      });
    }

    function renderTextDiv(text){
      const d = document.createElement('div');
      d.className = 'todo-text';
      d.textContent = text;
      return d;
    }

    // ---------- Init & README ----------
    function initReadme(){
      readme.innerHTML = `
        <strong>README — Todo CRUD Demo</strong>
        <ul>
          <li>API used: <a class="link" href="https://dummyjson.com/docs/todos" target="_blank">https://dummyjson.com/docs/todos</a>.</li>
          <li>Create / Update / Delete on DummyJSON are <em>simulated</em> — the API returns the expected object but the backend does not permanently store changes. This demo keeps a client-side override so you see changes in your session. (See docs.)</li>
          <li>Features: Fetch (GET), POST (/add), PUT (/{id}), DELETE (/{id}), client-side search/filter/sort, inline edit, checkbox toggle, responsive UI.</li>
          <li>Code: single-file. Use in local dev or CodePen/JSFiddle. No bundler required.</li>
        </ul>
      `;
    }

    // Run initial
    initReadme();
    fetchTodos();

    // expose for debug (optional)
    window.__todoDemo = { fetchTodos, todos, overrides, API_BASE };
  })();