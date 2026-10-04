let appData = JSON.parse(localStorage.getItem('testManagerData')) || {};
let currentTaskId = '';
let currentType = 'test-scenario';
let scenarios = [];

function generateId() { return Math.random().toString(36).substr(2, 9); }
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

const tableBody = document.getElementById('table-body');
const imageGallery = document.getElementById('image-gallery');
const savedTasksList = document.getElementById('saved-tasks-list');
const taskIdInput = document.getElementById('task-id');
const mainTitle = document.getElementById('main-title');

function init() {
    attachGlobalListeners();
    renderSidebar();
    const keys = Object.keys(appData);
    if (keys.length > 0) { loadTask(keys[0]); } 
    else { createNew('test-scenario'); }
}

function createNew(type) {
    currentTaskId = ''; currentType = type; taskIdInput.value = '';
    taskIdInput.classList.remove('input-error');
    if (type === 'test-scenario') {
        scenarios = [{ id: generateId(), url: '', scenarioName: '', testCases: [{ id: generateId(), name: '', expected: '', reqBody: '', resBody: '', status: 'not-tested', image: null }] }];
    } else {
        scenarios = [];
    }
    switchView(type); renderSidebar();
}

function loadTask(taskId) {
    if (!appData[taskId]) return;
    const task = appData[taskId];
    currentTaskId = taskId; currentType = task.type; taskIdInput.value = taskId;
    taskIdInput.classList.remove('input-error');
    scenarios = task.data || [];
    switchView(currentType); renderSidebar();
}

function saveTask() {
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
    
    let isValid = true;
    const newTaskId = taskIdInput.value.trim();
    
    if (!newTaskId) { taskIdInput.classList.add('input-error'); isValid = false; }

    if (currentType === 'test-scenario') {
        document.querySelectorAll('.scenario-name').forEach(el => {
            if (!el.value.trim()) { el.classList.add('input-error'); isValid = false; }
        });
        document.querySelectorAll('.tc-name').forEach(el => {
            if (!el.value.trim()) { el.classList.add('input-error'); isValid = false; }
        });
    }

    if (!isValid) {
        alert("Please fill in all mandatory fields (Task ID, Test Scenario, Test Case). Space-only values are not accepted.");
        return;
    }

    appData[newTaskId] = { type: currentType, data: currentType === 'test-scenario' ? scenarios : [] };
    try {
        localStorage.setItem('testManagerData', JSON.stringify(appData));
        currentTaskId = newTaskId; renderSidebar(); alert(`Task ${newTaskId} saved successfully!`);
    } catch (e) {
        alert("Error saving data. Storage might be full due to large images."); console.error(e);
    }
}

function deleteTask(taskId, e) {
    e.stopPropagation();
    if (confirm(`Are you sure you want to permanently delete task ${taskId}?`)) {
        delete appData[taskId];
        localStorage.setItem('testManagerData', JSON.stringify(appData));
        if (currentTaskId === taskId) {
            const keys = Object.keys(appData);
            if (keys.length > 0) loadTask(keys[0]); else createNew('test-scenario');
        } else {
            renderSidebar();
        }
    }
}

function switchView(type) {
    document.getElementById('view-test-scenario').classList.add('hidden');
    document.getElementById('view-bug-report').classList.add('hidden');
    if (type === 'test-scenario') {
        document.getElementById('view-test-scenario').classList.remove('hidden');
        mainTitle.textContent = "Test Scenario Management";
        renderTestScenario();
    } else if (type === 'bug-report') {
        document.getElementById('view-bug-report').classList.remove('hidden');
        mainTitle.textContent = "Bug Report Management";
    }
}

function renderSidebar() {
    savedTasksList.innerHTML = '';
    const keys = Object.keys(appData);
    if(keys.length === 0) {
        savedTasksList.innerHTML = '<li style="color:#7f8c8d; text-align:center; justify-content:center;">No saved tasks</li>'; return;
    }
    keys.forEach(taskId => {
        const li = document.createElement('li');
        if (taskId === currentTaskId) li.classList.add('active');
        const typeLabel = appData[taskId].type === 'bug-report' ? '🐛' : '📝';
        li.innerHTML = `<span class="task-name" title="${taskId}">${typeLabel} ${escapeHtml(taskId)}</span><button class="delete-task-btn" data-id="${taskId}">Delete</button>`;
        li.addEventListener('click', () => loadTask(taskId));
        li.querySelector('.delete-task-btn').addEventListener('click', (e) => deleteTask(taskId, e));
        savedTasksList.appendChild(li);
    });
}

function attachGlobalListeners() {
    taskIdInput.addEventListener('input', () => taskIdInput.classList.remove('input-error'));
    document.getElementById('save-task-btn').addEventListener('click', saveTask);

    const createBtn = document.getElementById('create-btn');
    const dropdownMenu = document.getElementById('create-dropdown');
    createBtn.addEventListener('click', () => { dropdownMenu.classList.toggle('show'); });
    window.addEventListener('click', (e) => {
        if (!e.target.matches('#create-btn') && dropdownMenu.classList.contains('show')) dropdownMenu.classList.remove('show');
    });

    document.querySelectorAll('.create-option').forEach(opt => {
        opt.addEventListener('click', (e) => { e.preventDefault(); createNew(e.target.dataset.type); });
    });

    const colToggles = document.querySelectorAll('.toggle-col');
    colToggles.forEach(toggle => {
        toggle.addEventListener('change', (e) => {
            const colClass = e.target.dataset.col;
            if (e.target.checked) document.body.classList.remove('hide-' + colClass);
            else document.body.classList.add('hide-' + colClass);
        });
    });

    document.getElementById('toggle-all-btn').addEventListener('click', () => {
        const anyUnchecked = Array.from(colToggles).some(t => !t.checked);
        colToggles.forEach(toggle => {
            toggle.checked = anyUnchecked;
            const colClass = toggle.dataset.col;
            if (anyUnchecked) document.body.classList.remove('hide-' + colClass);
            else document.body.classList.add('hide-' + colClass);
        });
    });

    document.getElementById('add-scenario-btn').addEventListener('click', () => {
        scenarios.push({ id: generateId(), url: '', scenarioName: '', testCases: [{ id: generateId(), name: '', expected: '', reqBody: '', resBody: '', status: 'not-tested', image: null }] });
        renderTestScenario();
    });

    const imageModal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-img');
    imageGallery.addEventListener('click', (e) => {
        if (e.target.tagName === 'IMG') { modalImg.src = e.target.src; imageModal.classList.remove('hidden'); }
    });
    document.querySelector('.close-modal').addEventListener('click', () => { imageModal.classList.add('hidden'); });
    imageModal.addEventListener('click', (e) => { if (e.target === imageModal) imageModal.classList.add('hidden'); });

    document.getElementById('export-pdf-btn').addEventListener('click', () => {
        const element = document.getElementById('pdf-content');
        const opt = {
            margin:       0.3,
            filename:     `${currentTaskId || 'Test_Scenarios'}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'in', format: 'a3', orientation: 'landscape' }
        };
        document.body.classList.add('exporting-pdf');
        const textareas = element.querySelectorAll('textarea');
        textareas.forEach(ta => { ta.style.height = (ta.scrollHeight) + 'px'; });

        html2pdf().set(opt).from(element).save().then(() => {
            document.body.classList.remove('exporting-pdf');
            textareas.forEach(ta => { ta.style.height = ''; });
        });
    });
}

function renderTestScenario() { 
    renderTable(); 
    renderImages(); 

    // Apply syntax highlighting to initially loaded blocks
    if (window.hljs) {
        document.querySelectorAll('.code-highlight').forEach(block => {
            if (block.textContent && block.textContent !== 'No code provided.') {
                hljs.highlightElement(block);
            }
        });
    }
}

function renderTable() {
    tableBody.innerHTML = '';
    let globalRowIndex = 1;

    scenarios.forEach((scenario, sIndex) => {
        scenario.testCases.forEach((tc, tcIndex) => {
            const tr = document.createElement('tr');
            
            const tdIndex = document.createElement('td');
            tdIndex.className = 'col-index'; tdIndex.textContent = globalRowIndex;
            tr.appendChild(tdIndex);

            if (tcIndex === 0) {
                const tdUrl = document.createElement('td'); tdUrl.className = 'col-url'; tdUrl.rowSpan = scenario.testCases.length;
                tdUrl.innerHTML = `<textarea class="scenario-url" data-sindex="${sIndex}" placeholder="Enter URL/Query">${escapeHtml(scenario.url)}</textarea>`;
                tr.appendChild(tdUrl);

                const tdScenario = document.createElement('td'); tdScenario.className = 'col-scenario'; tdScenario.rowSpan = scenario.testCases.length;
                tdScenario.innerHTML = `<textarea class="scenario-name" data-sindex="${sIndex}" placeholder="Enter Scenario Name">${escapeHtml(scenario.scenarioName)}</textarea>
                    <div style="margin-top: 10px;"><button class="secondary-btn add-tc-btn" data-sindex="${sIndex}">+ Add Test Case</button>
                    <button class="danger-btn del-scenario-btn" data-sindex="${sIndex}" style="margin-top: 5px;">Delete Scenario</button></div>`;
                tr.appendChild(tdScenario);
            }

            const tdTcName = document.createElement('td'); tdTcName.className = 'col-testcase';
            tdTcName.innerHTML = `<textarea class="tc-name" data-sindex="${sIndex}" data-tcindex="${tcIndex}" placeholder="Test Case Description">${escapeHtml(tc.name)}</textarea>`;
            tr.appendChild(tdTcName);

            const tdExpected = document.createElement('td'); tdExpected.className = 'col-expected';
            tdExpected.innerHTML = `<textarea class="tc-expected" data-sindex="${sIndex}" data-tcindex="${tcIndex}" placeholder="Expected Result">${escapeHtml(tc.expected)}</textarea>`;
            tr.appendChild(tdExpected);

            const tdReq = document.createElement('td'); tdReq.className = 'col-req';
            tdReq.innerHTML = createCodeWrapper('reqBody', sIndex, tcIndex, tc.reqBody); tr.appendChild(tdReq);

            const tdRes = document.createElement('td'); tdRes.className = 'col-res';
            tdRes.innerHTML = createCodeWrapper('resBody', sIndex, tcIndex, tc.resBody); tr.appendChild(tdRes);

            const tdImage = document.createElement('td'); tdImage.className = 'col-image';
            if (tc.image) {
                tdImage.innerHTML = `
                    <div style="color: green; font-size: 12px; font-weight: bold; margin-bottom: 5px;">Image Uploaded ✓</div>
                    <button class="remove-img-btn" data-sindex="${sIndex}" data-tcindex="${tcIndex}">Remove Image</button>`;
            } else {
                tdImage.innerHTML = `<input type="file" accept="image/*" class="img-upload" data-sindex="${sIndex}" data-tcindex="${tcIndex}">`;
            }
            tr.appendChild(tdImage);

            const tdStatus = document.createElement('td'); tdStatus.className = 'col-status';
            tdStatus.innerHTML = `<select class="tc-status ${tc.status}" data-sindex="${sIndex}" data-tcindex="${tcIndex}">
                    <option value="not-tested" ${tc.status === 'not-tested' ? 'selected' : ''}>Not Tested</option>
                    <option value="passed" ${tc.status === 'passed' ? 'selected' : ''}>Passed</option>
                    <option value="failed" ${tc.status === 'failed' ? 'selected' : ''}>Failed</option>
                </select>`;
            tr.appendChild(tdStatus);

            const tdActions = document.createElement('td'); tdActions.className = 'col-actions';
            tdActions.innerHTML = `<button class="danger-btn del-tc-btn" data-sindex="${sIndex}" data-tcindex="${tcIndex}">Delete</button>`;
            tr.appendChild(tdActions);

            tableBody.appendChild(tr); globalRowIndex++;
        });
    });
    attachTableListeners();
}

function createCodeWrapper(field, sIndex, tcIndex, value) {
    const displayValue = value ? escapeHtml(value) : '<span style="color: #5c6370;">No code provided.</span>';
    return `
        <div class="code-wrapper">
            <textarea class="code-input" data-field="${field}" data-sindex="${sIndex}" data-tcindex="${tcIndex}" placeholder="Paste Code / JSON here...">${escapeHtml(value)}</textarea>
            <div class="code-actions">
                <button class="paste-btn" data-field="${field}" data-sindex="${sIndex}" data-tcindex="${tcIndex}">Paste</button>
                <button class="copy-btn" data-value="${escapeHtml(value)}">Copy</button>
            </div>
            <div class="tooltip-container">
                <div class="tooltip-content">
                    <pre><code class="code-highlight language-json">${displayValue}</code></pre>
                </div>
            </div>
        </div>
    `;
}

function attachTableListeners() {
    document.querySelectorAll('.scenario-url').forEach(el => { el.addEventListener('input', (e) => { scenarios[e.target.dataset.sindex].url = e.target.value; }); });
    
    document.querySelectorAll('.scenario-name').forEach(el => { 
        el.addEventListener('input', (e) => { 
            scenarios[e.target.dataset.sindex].scenarioName = e.target.value; 
            e.target.classList.remove('input-error'); 
        }); 
    });
    
    document.querySelectorAll('.tc-name').forEach(el => { 
        el.addEventListener('input', (e) => { 
            scenarios[e.target.dataset.sindex].testCases[e.target.dataset.tcindex].name = e.target.value; 
            e.target.classList.remove('input-error'); 
        }); 
    });
    
    document.querySelectorAll('.tc-expected').forEach(el => { el.addEventListener('input', (e) => { scenarios[e.target.dataset.sindex].testCases[e.target.dataset.tcindex].expected = e.target.value; }); });

    document.querySelectorAll('.code-input').forEach(el => {
        el.addEventListener('input', (e) => {
            const val = e.target.value;
            scenarios[e.target.dataset.sindex].testCases[e.target.dataset.tcindex][e.target.dataset.field] = val;
            
            const wrapper = e.target.closest('.code-wrapper');
            const codeBlock = wrapper.querySelector('.code-highlight');
            if (val) {
                codeBlock.textContent = val;
                delete codeBlock.dataset.highlighted; // Clear hljs flag
                codeBlock.className = 'code-highlight language-json'; 
                if (window.hljs) hljs.highlightElement(codeBlock);
            } else {
                codeBlock.innerHTML = '<span style="color: #5c6370;">No code provided.</span>';
            }
            wrapper.querySelector('.copy-btn').dataset.value = val;
        });
    });

    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const val = e.target.dataset.value;
            navigator.clipboard.writeText(val).then(() => {
                const orig = e.target.textContent; e.target.textContent = 'Copied!';
                setTimeout(() => { e.target.textContent = orig; }, 1500);
            });
        });
    });

    document.querySelectorAll('.paste-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const sIndex = e.target.dataset.sindex;
            const tcIndex = e.target.dataset.tcindex;
            const field = e.target.dataset.field;
            try {
                const text = await navigator.clipboard.readText();
                scenarios[sIndex].testCases[tcIndex][field] = text;
                renderTestScenario();
            } catch (err) {
                alert('Clipboard permission denied by browser. Please click inside the text box and press Ctrl+V (Windows) or Cmd+V (Mac) to paste.');
            }
        });
    });

    document.querySelectorAll('.tc-status').forEach(el => {
        el.addEventListener('change', (e) => {
            scenarios[e.target.dataset.sindex].testCases[e.target.dataset.tcindex].status = e.target.value;
            e.target.className = 'tc-status ' + e.target.value;
        });
    });

    document.querySelectorAll('.img-upload').forEach(el => {
        el.addEventListener('change', (e) => {
            const file = e.target.files[0]; if (!file) return;
            const sIndex = e.target.dataset.sindex; const tcIndex = e.target.dataset.tcindex;
            const reader = new FileReader();
            reader.onload = (event) => { scenarios[sIndex].testCases[tcIndex].image = event.target.result; renderTestScenario(); };
            reader.readAsDataURL(file);
        });
    });

    document.querySelectorAll('.remove-img-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if(confirm("Remove this image?")) {
                scenarios[e.target.dataset.sindex].testCases[e.target.dataset.tcindex].image = null;
                renderTestScenario();
            }
        });
    });

    document.querySelectorAll('.add-tc-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            scenarios[e.target.dataset.sindex].testCases.push({ id: generateId(), name: '', expected: '', reqBody: '', resBody: '', status: 'not-tested', image: null });
            renderTestScenario();
        });
    });

    document.querySelectorAll('.del-scenario-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (confirm('Are you sure you want to delete this entire scenario?')) {
                scenarios.splice(e.target.dataset.sindex, 1); renderTestScenario();
            }
        });
    });

    document.querySelectorAll('.del-tc-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const sIndex = e.target.dataset.sindex;
            if (scenarios[sIndex].testCases.length === 1) { alert('Cannot delete the last test case. Delete the scenario instead.'); return; }
            if (confirm('Delete this test case?')) { scenarios[sIndex].testCases.splice(e.target.dataset.tcindex, 1); renderTestScenario(); }
        });
    });
}

function renderImages() {
    imageGallery.innerHTML = ''; let globalRowIndex = 1; let hasImages = false;
    scenarios.forEach((scenario) => {
        scenario.testCases.forEach((tc) => {
            if (tc.image) {
                hasImages = true;
                const card = document.createElement('div'); card.className = 'image-card';
                card.innerHTML = `<img src="${tc.image}" alt="Test Case ${globalRowIndex}"><h4>Test Case #${globalRowIndex}</h4><p style="font-size:12px; color:#666; margin-top:5px;">${escapeHtml(tc.name) || 'No title'}</p>`;
                imageGallery.appendChild(card);
            }
            globalRowIndex++;
        });
    });
    if (!hasImages) imageGallery.innerHTML = '<p style="color: #6c757d;">No images uploaded yet.</p>';
}

init();
