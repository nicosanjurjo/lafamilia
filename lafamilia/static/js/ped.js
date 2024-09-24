$(document).ready(function() {

    $('#myTable').DataTable({
        order: [[0, 'desc']] });

    let pedidoId;  // Variable para almacenar el ID del pedido que se está editando

    // Capturar el ID del pedido al abrir el modal
    $('.btn-warning').on('click', function() {
        pedidoId = $(this).closest('tr').find('td:first').text(); // Obtener el ID del pedido desde la tabla
        console.log($(this));
        console.log('Editando pedido ID:', pedidoId);
        
        // Vaciar el modal
        $('#marca-buttons').empty();
        $('#productos-table tbody').empty();
        $('#pedido-table tbody').empty();
        $('#total-actualizacion').text('0');

        // Añadir el botón "Todas" manualmente
        $('#marca-buttons').append(`<button type="button" class="btn btn-secondary" id="all-btn">Todas</button>`);

        // Cargar los datos de los productos
        $.ajax({
            url: 'pedido_especial/api/obtener-datos-iniciales/',
            method: 'GET',
            success: function(data) {
                // Poblar los botones de marcas
                data.marcas.forEach(function(marca) {
                    $('#marca-buttons').append(`<button class="marca-btn" data-marca="${marca}">${marca}</button>`);
                });

                // Poblar la tabla de productos
                data.productos.forEach(function(producto) {
                    $('#productos-table tbody').append(`
                        <tr data-prodid="${producto.id}" data-marca="${producto.marca}">
                            <td>${producto.nombre}</td>
                            <td>${producto.marca}</td>
                            <td>${producto.precio}</td>
                            <td><button class="btn btn-primary add-producto">+</button></td>
                        </tr>
                    `);
                });
            },
            error: function(error) {
                console.error('Error al obtener los datos iniciales:', error);
            }
        });
    });

    $('#marca-buttons').on('click', '#all-btn', function() {
        $('#productos-table tbody tr').show(); // Mostrar todos los productos
    });

    $('#marca-buttons').on('click', '.marca-btn', function() {
        var selectedMarca = $(this).attr('data-marca');
        $('#productos-table tbody tr').hide(); // Ocultar todos los productos
        $('#productos-table tbody tr[data-marca="' + selectedMarca + '"]').show(); // Mostrar solo los productos de la marca seleccionada
    });

    // Manejar el evento de click en los botones "Agregar" en la tabla de productos
    $('#productos-table').on('click', '.add-producto', function() {
        var productoId = $(this).closest('tr').data('prodid');
        var productoMarca = $(this).closest('tr').find('td').eq(0).text();
        var productoNombre = $(this).closest('tr').find('td').eq(1).text();
        var productoPrecio = parseFloat($(this).closest('tr').find('td').eq(2).text());

        var uniqueKey = productoId + '-' + productoMarca + '-' + productoNombre;

        var productoEnPedido = $('#pedido-table tbody').find('tr[data-key="' + uniqueKey + '"]');
        if (productoEnPedido.length > 0) {
            var cantidadInput = productoEnPedido.find('.cantidad-input');
            var cantidadActual = parseInt(cantidadInput.val());
            var nuevaCantidad = cantidadActual + 1;
            cantidadInput.val(nuevaCantidad);

            var nuevoPrecioTotal = productoPrecio * nuevaCantidad;
            productoEnPedido.find('.precio-total').text(nuevoPrecioTotal);
        } else {
            var nuevoProducto = `
                <tr data-key="${uniqueKey}" data-productoid="${productoId}">
                    <td>${productoMarca}</td>
                    <td>${productoNombre}</td>
                    <td><input type="number" class="cantidad-input" value="1" min="1"></td>
                    <td class="precio-unitario">${productoPrecio}</td>
                    <td class="precio-total" data-precio-unitario="${productoPrecio}">${productoPrecio}</td>
                    <td><button type="button" class="btn btn-danger remove-producto">Eliminar</button></td>
                </tr>`;

            $('#pedido-table tbody').append(nuevoProducto);
        }

        recalcularTotal();
    });

    $('#pedido-table').on('click', '.remove-producto', function() {
        $(this).closest('tr').remove();
        recalcularTotal();
    });

    $('#pedido-table').on('input', '.cantidad-input', function() {
        var nuevaCantidad = parseInt($(this).val());
        var productoPrecio = parseFloat($(this).closest('tr').find('.precio-total').data('precio-unitario'));

        var nuevoPrecioTotal = productoPrecio * nuevaCantidad;
        $(this).closest('tr').find('.precio-total').text(nuevoPrecioTotal);

        recalcularTotal();
    });

    function recalcularTotal() {
        var totalActualizacion = 0;
        $('#pedido-table tbody tr').each(function() {
            var precioTotal = parseFloat($(this).find('.precio-total').text());
            totalActualizacion += precioTotal;
        });
        $('#total-actualizacion').text(totalActualizacion);
    }

    $('#actualizar-pedido').on('click', function() {
        let actualizacionData = {
            pedido_id: pedidoId,  // Incluir el ID del pedido
            productos: [],
            total: parseFloat($('#total-actualizacion').text())
        };

        $('#pedido-table tbody tr').each(function() {
            let productoId = $(this).data('productoid');
            let cantidad = parseInt($(this).find('.cantidad-input').val());
            let precioUnitario = parseFloat($(this).find('.precio-unitario').text());

            if (productoId) {
                actualizacionData.productos.push({
                    producto_id: productoId,
                    cantidad: cantidad,
                    precio_unitario: precioUnitario
                });
            }
        });

        console.log('Datos para enviar al backend:', actualizacionData);
        enviarActualizacionAlBackend(actualizacionData);
    });

    function enviarActualizacionAlBackend(actualizacionData) {
        $.ajax({
            url: 'pedidos/actualizar/' + actualizacionData.pedido_id + '/',
            method: 'POST',
            data: JSON.stringify(actualizacionData),
            contentType: 'application/json',
            success: function(response) {
                alert('Pedido actualizado exitosamente');
                $('#actualizarModal').modal('hide');
                location.reload();
            },
            error: function(xhr) {
                console.error('Error al actualizar el pedido:', xhr);
                let errorMessages = xhr.responseJSON.errors || [xhr.responseJSON.error || 'Hubo un error al actualizar el pedido'];
                alert(errorMessages.join('\n'));
            }
        });
    }

    $('#remitos').on('click', function() {
        var url = $(this).data('url');  // Obtener la URL desde el atributo data-url
        $('#filtroForm').attr('action', url).submit();
    });

    // Manejar el clic en el botón "Exportar pedidos"
    $('#liquidacion').on('click', function() {
        var url = $(this).data('url');  // Obtener la URL desde el atributo data-url
        $('#filtroForm').attr('action', url).submit();
    });
});
