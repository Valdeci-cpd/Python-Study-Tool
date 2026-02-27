// Inicialização do CodeMirror
const editor = CodeMirror.fromTextArea(document.getElementById('code-editor'), {
    mode: 'python',
    theme: 'eclipse',
    lineNumbers: true,
    indentUnit: 4,
    smartIndent: true,
    autofocus: true
});

// Forçar recalculo de layout após inicialização
setTimeout(() => {
    editor.refresh();
}, 0);

// Recalcular tamanho do editor quando a janela é redimensionada
window.addEventListener('resize', () => {
    editor.refresh();
});

// Estado da aplicação
let annotations = []; // { id, from, to, text, mark }
let currentPopupAnnotationId = null;
let currentSelection = null;

// Elementos DOM
const btnExport = document.getElementById('btn-export');
const btnImport = document.getElementById('btn-import');
const importFile = document.getElementById('import-file');
const contextMenu = document.getElementById('context-menu');
const menuAddAnnotation = document.getElementById('menu-add-annotation');
const menuEditAnnotation = document.getElementById('menu-edit-annotation');
const menuDeleteAnnotation = document.getElementById('menu-delete-annotation');
const tooltip = document.getElementById('annotation-tooltip');
const tooltipText = document.getElementById('tooltip-text');

// Utilitário para gerar ID
function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

// Encontrar anotação por ID
function findAnnotationById(id) {
    return annotations.find(ann => ann.id === id);
}

// Encontrar anotação na posição do cursor
function findAnnotationAtCursor(pos) {
    return annotations.find(ann => {
        const from = ann.from;
        const to = ann.to;
        return (pos.line > from.line || (pos.line === from.line && pos.ch >= from.ch)) &&
               (pos.line < to.line || (pos.line === to.line && pos.ch <= to.ch));
    });
}

// Criar marcação no editor
function createMark(annotation) {
    const mark = editor.markText(
        annotation.from,
        annotation.to,
        { className: 'cm-mark', attributes: { 'data-id': annotation.id } }
    );
    annotation.mark = mark;
}

// Renderizar todas as marcações
function renderAllMarks() {
    editor.getAllMarks().forEach(mark => mark.clear());
    annotations.forEach(ann => createMark(ann));
}

// Adicionar anotação
function addAnnotation(from, to, text) {
    const id = generateId();
    const annotation = { id, from, to, text };
    annotations.push(annotation);
    createMark(annotation);
}

// Remover anotação
function removeAnnotationById(id) {
    const index = annotations.findIndex(ann => ann.id === id);
    if (index !== -1) {
        const ann = annotations[index];
        if (ann.mark) ann.mark.clear();
        annotations.splice(index, 1);
    }
}

// Editar anotação
function updateAnnotationText(id, newText) {
    const annotation = findAnnotationById(id);
    if (annotation) {
        annotation.text = newText;
    }
}

// Mostrar context menu
function showContextMenu(event, selectionData) {
    event.preventDefault();

    // Fechar tooltip ao abrir context menu
    hideTooltip();

    const x = event.pageX;
    const y = event.pageY;

    contextMenu.style.left = x + 'px';
    contextMenu.style.top = y + 'px';

    currentSelection = selectionData;

    // Verificar se tem anotação na seleção
    let hasAnnotation = false;
    if (selectionData && selectionData.type === 'selection') {
        // Verificar se a seleção tem anotação
        const range = editor.getRange(selectionData.from, selectionData.to);
        const marks = editor.findMarks(selectionData.from, selectionData.to);
        hasAnnotation = marks.length > 0;

        if (hasAnnotation) {
            currentPopupAnnotationId = marks[0].attributes['data-id'];
        }
    } else if (selectionData && selectionData.type === 'mark') {
        hasAnnotation = true;
        currentPopupAnnotationId = selectionData.id;
    }

    // Mostrar/esconder itens do menu
    menuAddAnnotation.style.display = hasAnnotation ? 'none' : 'block';
    menuEditAnnotation.style.display = hasAnnotation ? 'block' : 'none';
    menuDeleteAnnotation.style.display = hasAnnotation ? 'block' : 'none';

    contextMenu.classList.remove('hidden');
}

// Esconder context menu
function hideContextMenu() {
    contextMenu.classList.add('hidden');
}

// Mostrar tooltip
function showTooltip(annotation, event) {
    if (event) {
        const x = event.pageX + 10;
        const y = event.pageY + 10;
        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
    }
    tooltipText.textContent = annotation.text;
    tooltip.classList.remove('hidden');
}

// Esconder tooltip
function hideTooltip() {
    tooltip.classList.add('hidden');
    tooltipText.textContent = '';
}

// Abrir input para nova anotação
function promptForAnnotation(callback) {
    const text = prompt('Digite sua anotação:');
    if (text && text.trim()) {
        callback(text.trim());
    }
}

// Abrir input para editar anotação
function promptToEditAnnotation(annotation, callback) {
    const text = prompt('Edite sua anotação:', annotation.text);
    if (text !== null && text.trim()) {
        callback(text.trim());
    }
}

// =======================
// Event Listeners
// =======================

// Context menu - Botão direito no editor
editor.getWrapperElement().addEventListener('contextmenu', (event) => {
    event.preventDefault();

    const coords = editor.coordsChar({ left: event.pageX, top: event.pageY });

    // Verificar se clicou numa anotação
    const markAtCursor = editor.findMarks(coords, coords).find(m => m.className === 'cm-mark');

    if (markAtCursor) {
        // Clicou numa anotação
        const dataId = markAtCursor.attributes['data-id'];
        const annotation = findAnnotationById(parseInt(dataId));
        if (annotation) {
            showContextMenu(event, { type: 'mark', id: annotation.id });
        }
    } else {
        // Verificar se tem seleção
        const selection = editor.getSelection();
        if (selection) {
            const from = editor.getCursor('from');
            const to = editor.getCursor('to');
            showContextMenu(event, { type: 'selection', from, to });
        }
    }
});

// Opção: Adicionar Anotação
menuAddAnnotation.addEventListener('click', () => {
    if (currentSelection && currentSelection.type === 'selection') {
        promptForAnnotation((text) => {
            addAnnotation(currentSelection.from, currentSelection.to, text);
            hideContextMenu();
        });
    }
});

// Opção: Editar Anotação
menuEditAnnotation.addEventListener('click', () => {
    const annotation = findAnnotationById(currentPopupAnnotationId);
    if (annotation) {
        promptToEditAnnotation(annotation, (text) => {
            updateAnnotationText(annotation.id, text);
            hideContextMenu();
        });
    }
});

// Opção: Deletar Anotação
menuDeleteAnnotation.addEventListener('click', () => {
    removeAnnotationById(currentPopupAnnotationId);
    hideContextMenu();
});

// Fechar context menu ao clicar fora
document.addEventListener('click', (event) => {
    if (!contextMenu.contains(event.target)) {
        hideContextMenu();
    }
});

// Hover nas anotações para mostrar tooltip
editor.getWrapperElement().addEventListener('mousemove', (event) => {
    const coords = editor.coordsChar({ left: event.pageX, top: event.pageY });
    const marks = editor.findMarks(coords, coords);
    const markAtCursor = marks.find(m => m.className === 'cm-mark');

    if (markAtCursor) {
        const dataId = markAtCursor.attributes['data-id'];
        const annotation = findAnnotationById(parseInt(dataId));
        if (annotation) {
            showTooltip(annotation, event);
        }
    } else {
        hideTooltip();
    }
});

// Esconder tooltip ao sair do editor
editor.getWrapperElement().addEventListener('mouseleave', () => {
    hideTooltip();
});

// =======================
// Exportar/Importar
// =======================

btnExport.addEventListener('click', () => {
    const code = editor.getValue();
    const exportAnnotations = annotations.map(({ id, from, to, text }) => ({
        id, from, to, text
    }));
    const data = {
        code,
        annotations: exportAnnotations
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'python-study-export.json';
    a.click();
    URL.revokeObjectURL(url);
});

btnImport.addEventListener('click', () => {
    importFile.click();
});

importFile.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const data = JSON.parse(ev.target.result);
            if (!data.code || !Array.isArray(data.annotations)) {
                throw new Error('Formato inválido');
            }

            // Limpar estado atual
            editor.getAllMarks().forEach(mark => mark.clear());
            annotations = [];

            // Restaurar código
            editor.setValue(data.code);

            // Restaurar anotações
            data.annotations.forEach(ann => {
                const annotation = {
                    id: ann.id,
                    from: ann.from,
                    to: ann.to,
                    text: ann.text
                };
                annotations.push(annotation);
                createMark(annotation);
            });

            importFile.value = '';
        } catch (err) {
            alert('Erro ao importar arquivo: ' + err.message);
        }
    };
    reader.readAsText(file);
});

// =======================
// Código exemplo inicial
// =======================

editor.setValue(`# Cole seu código Python aqui

def exemplo():
    print("Olá, mundo!")

exemplo()

# Selecione um trecho e clique com botão direito para anotar`);