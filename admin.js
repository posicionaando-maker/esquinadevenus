<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin · Esquina Venus</title>
    <link rel="stylesheet" href="css/style.css">
    <style>
        .admin-header { background: #8B5A2B; color: white; padding: 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; }
        .admin-main { max-width: 1200px; margin: 2rem auto; padding: 0 1rem; }
        .formulario { background: white; padding: 1.5rem; border-radius: 16px; margin-bottom: 2rem; }
        .formulario input, .formulario textarea, .formulario select { width: 100%; padding: 0.75rem; margin: 0.5rem 0; border: 1px solid #ddd; border-radius: 8px; }
        .btn { background: #8B5A2B; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; margin-right: 0.5rem; }
        .btn-eliminar { background: #e74c3c; }
        .btn-exportar { background: #27ae60; }
        .btn-importar { background: #2980b9; }
        table { width: 100%; background: white; border-radius: 16px; overflow: hidden; }
        th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #eee; }
        .login { max-width: 400px; margin: 100px auto; background: white; padding: 2rem; border-radius: 16px; text-align: center; }
        .barra-herramientas { margin-bottom: 1rem; display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
        .error { color: red; }
        .exito { color: green; }
    </style>
</head>
<body>
<div id="app"></div>

<script>
    const ADMIN_USER = "admin";
    const ADMIN_PASS = "esquinavenus";
    let productosActuales = [];
    
    function checkAuth() {
        return localStorage.getItem('admin_auth') === 'true';
    }
    
    function login(usuario, password) {
        if(usuario === ADMIN_USER && password === ADMIN_PASS) {
            localStorage.setItem('admin_auth', 'true');
            cargarProductos().then(() => renderAdmin());
            return true;
        }
        return false;
    }
    
    function logout() {
        localStorage.removeItem('admin_auth');
        renderLogin();
    }
    
    async function cargarProductos() {
        try {
            const response = await fetch('data/productos.json');
            const data = await response.json();
            productosActuales = data.productos || [];
            return productosActuales;
        } catch(e) {
            console.log('Error cargando JSON, usando backup');
            const backup = localStorage.getItem('esquina_productos_backup');
            productosActuales = backup ? JSON.parse(backup) : [];
            return productosActuales;
        }
    }
    
    async function guardarProductosEnJSON() {
        const data = {
            version: "1",
            ultima_actualizacion: new Date().toISOString().split('T')[0],
            productos: productosActuales
        };
        
        // Guardar en localStorage como respaldo
        localStorage.setItem('esquina_productos_backup', JSON.stringify(productosActuales));
        
        // Para descargar el archivo JSON (el dueño lo guarda en el servidor manualmente)
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'productos.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('✅ JSON descargado. Súbelo manualmente a la carpeta /data/ del servidor para que los clientes vean los cambios.');
    }
    
    function exportarJSON() {
        const data = {
            version: "1",
            ultima_actualizacion: new Date().toISOString().split('T')[0],
            productos: productosActuales
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `esquina-venus-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    function importarJSON(event) {
        const file = event.target.files[0];
        if(!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                if(data.productos && Array.isArray(data.productos)) {
                    productosActuales = data.productos;
                    guardarProductosEnJSON();
                    renderAdmin();
                    alert('✅ Productos importados correctamente. Descarga el JSON y súbelo al servidor.');
                } else {
                    alert('❌ Formato inválido. El archivo debe tener una propiedad "productos".');
                }
            } catch(err) {
                alert('❌ Error al leer el archivo JSON');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }
    
    function agregarProducto(producto) {
        const nuevoId = productosActuales.length > 0 ? Math.max(...productosActuales.map(p => p.id)) + 1 : 1;
        productosActuales.push({ 
            ...producto, 
            id: nuevoId, 
            fecha_agregado: new Date().toISOString().split('T')[0],
            disponible: true 
        });
        guardarProductosEnJSON();
        renderAdmin();
    }
    
    function editarProducto(id, datosActualizados) {
        const index = productosActuales.findIndex(p => p.id == id);
        if(index !== -1) {
            productosActuales[index] = { ...productosActuales[index], ...datosActualizados };
            guardarProductosEnJSON();
            renderAdmin();
        }
    }
    
    function eliminarProducto(id) {
        if(confirm('¿Eliminar este producto permanentemente?')) {
            productosActuales = productosActuales.filter(p => p.id != id);
            guardarProductosEnJSON();
            renderAdmin();
        }
    }
    
    function renderLogin() {
        document.getElementById('app').innerHTML = `
            <div class="login">
                <h2>🐚 Esquina Venus</h2>
                <h3>Panel del dueño</h3>
                <div id="login-error"></div>
                <input type="text" id="login-user" placeholder="Usuario" autocomplete="off">
                <input type="password" id="login-pass" placeholder="Contraseña">
                <button class="btn" onclick="handleLogin()">Ingresar</button>
                <p style="margin-top:1rem; font-size:0.8rem">Usuario: admin | Contraseña: esquinavenus</p>
            </div>
        `;
    }
    
    window.handleLogin = function() {
        const user = document.getElementById('login-user').value;
        const pass = document.getElementById('login-pass').value;
        if(!login(user, pass)) {
            document.getElementById('login-error').innerHTML = '<p class="error">Usuario o contraseña incorrectos</p>';
        }
    };
    
    function renderAdmin() {
        const categorias = [
            { value: 'libro_fisico', label: '📖 Libro físico' },
            { value: 'audio_resumen', label: '🎧 Audioresumen' },
            { value: 'herramienta_pwa', label: '🛠️ Herramienta PWA' }
        ];
        
        const estadosLibro = [
            { value: 'como_nuevo', label: '✨ Como nuevo' },
            { value: 'bueno', label: '📖 Buen estado' },
            { value: 'aceptable', label: '📘 Aceptable' }
        ];
        
        document.getElementById('app').innerHTML = `
            <div class="admin-header">
                <h1>🐚 Esquina Venus · Admin</h1>
                <div>
                    <a href="index.html" style="color:white">Ver tienda</a>
                    <button class="btn" onclick="logout()" style="margin-left:1rem">Cerrar</button>
                </div>
            </div>
            <div class="admin-main">
                <div class="formulario">
                    <h2>➕ Agregar producto</h2>
                    <input type="text" id="nombre" placeholder="Nombre" required>
                    <select id="categoria">
                        ${categorias.map(c => `<option value="${c.value}">${c.label}</option>`).join('')}
                    </select>
                    <textarea id="descripcion" placeholder="Descripción" rows="3"></textarea>
                    <input type="number" step="0.01" id="precio" placeholder="Precio (CUP)" required>
                    <select id="tipo">
                        <option value="fisico">📦 Físico (libro)</option>
                        <option value="digital">💻 Digital (audio o herramienta)</option>
                    </select>
                    <div id="campo-estado" style="display:none">
                        <select id="estado">
                            ${estadosLibro.map(e => `<option value="${e.value}">${e.label}</option>`).join('')}
                        </select>
                    </div>
                    <input type="text" id="link" placeholder="Link de descarga (si es digital)">
                    <input type="text" id="imagen" placeholder="URL de imagen (opcional)">
                    <button class="btn" onclick="agregarProductoFromForm()">Guardar producto</button>
                </div>
                
                <div class="barra-herramientas">
                    <button class="btn btn-exportar" onclick="exportarJSON()">📤 Exportar JSON (backup)</button>
                    <label class="btn btn-importar" style="display:inline-block; cursor:pointer">
                        📥 Importar JSON
                        <input type="file" id="importar-json" accept=".json" style="display:none" onchange="importarJSON(event)">
                    </label>
                    <span style="font-size:0.8rem; color:#666">| Total: ${productosActuales.length} productos</span>
                </div>
                
                <div style="overflow-x:auto">
                    <table>
                        <thead>
                            <tr><th>ID</th><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Tipo</th><th>Acciones</th></tr>
                        </thead>
                        <tbody>
                            ${productosActuales.map(p => `
                                <tr>
                                    <td>${p.id}</td>
                                    <td><strong>${escapeHtml(p.nombre)}</strong><br><small>${escapeHtml(p.descripcion?.substring(0, 50) || '')}</small></td>
                                    <td>${p.categoria === 'libro_fisico' ? '📖 Libro' : p.categoria === 'audio_resumen' ? '🎧 Audio' : '🛠️ Herramienta'} ${p.estado ? `(${p.estado})` : ''}</td>
                                    <td>$${p.precio}</td>
                                    <td>${p.tipo === 'fisico' ? '📦 Físico' : '💻 Digital'}</td>
                                    <td>
                                        <button class="btn" style="padding:0.3rem 0.8rem" onclick="editarPrecio(${p.id})">✏️ Precio</button>
                                        <button class="btn btn-eliminar" style="padding:0.3rem 0.8rem" onclick="eliminarProducto(${p.id})">🗑️</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        // Mostrar/ocultar campo estado según categoría
        const categoriaSelect = document.getElementById('categoria');
        const campoEstado = document.getElementById('campo-estado');
        if(categoriaSelect && campoEstado) {
            categoriaSelect.addEventListener('change', () => {
                campoEstado.style.display = categoriaSelect.value === 'libro_fisico' ? 'block' : 'none';
            });
            campoEstado.style.display = categoriaSelect.value === 'libro_fisico' ? 'block' : 'none';
        }
    }
    
    window.agregarProductoFromForm = function() {
        const nombre = document.getElementById('nombre').value.trim();
        const categoria = document.getElementById('categoria').value;
        const descripcion = document.getElementById('descripcion').value.trim();
        const precio = parseFloat(document.getElementById('precio').value);
        const tipo = document.getElementById('tipo').value;
        const link = document.getElementById('link').value.trim();
        const imagen = document.getElementById('imagen').value.trim();
        const estado = document.getElementById('estado')?.value || 'bueno';
        
        if(!nombre || isNaN(precio)) {
            alert('Completa nombre y precio');
            return;
        }
        
        const nuevoProducto = { 
            nombre, 
            categoria, 
            descripcion, 
            precio, 
            tipo, 
            link_descarga: link || null,
            imagen: imagen || null,
            disponible: true
        };
        
        if(categoria === 'libro_fisico') {
            nuevoProducto.estado = estado;
        }
        
        agregarProducto(nuevoProducto);
        
        // Limpiar formulario
        document.getElementById('nombre').value = '';
        document.getElementById('descripcion').value = '';
        document.getElementById('precio').value = '';
        document.getElementById('link').value = '';
        document.getElementById('imagen').value = '';
    };
    
    window.editarPrecio = function(id) {
        const producto = productosActuales.find(p => p.id == id);
        const nuevoPrecio = prompt('Nuevo precio (CUP):', producto.precio);
        if(nuevoPrecio && !isNaN(parseFloat(nuevoPrecio))) {
            editarProducto(id, { precio: parseFloat(nuevoPrecio) });
        }
    };
    
    window.eliminarProducto = eliminarProducto;
    window.logout = logout;
    window.exportarJSON = exportarJSON;
    window.importarJSON = importarJSON;
    
    function escapeHtml(text) {
        if(!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    if(checkAuth()) {
        cargarProductos().then(() => renderAdmin());
    } else {
        renderLogin();
    }
</script>
</body>
</html>