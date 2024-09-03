$(document).ready(function() {

    $.ajax({
        url: 'api/obtener-datos-iniciales/',
        method: 'GET',
        success: function (data) {
            // Poblar selectores de vendedores y clientes
            data.vendedores.forEach(function (vendedor) {
                $('#vendedor').append(`<option value="${vendedor.id}">${vendedor.nombre}</option>`);
            });
            data.clientes.forEach(function (cliente) {
                $('#cliente').append(`<option value="${cliente.id}">${cliente.nombre} - ${cliente.direccion}</option>`);
            });

            // Poblar los botones de marcas
            data.marcas.forEach(function (marca) {
                $('#marca-buttons').append(`<button class="marca-btn" data-marca="${marca}">${marca}</button>`);
            });

            // Poblar la tabla de productos
            data.productos.forEach(function (producto) {
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
        error: function (error) {
            console.error('Error al obtener los datos iniciales:', error);
        }
    });

    $('#all-btn').on('click', function() {
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
        var productoNombre = $(this).closest('tr').find('td').eq(0).text();
        var productoMarca = $(this).closest('tr').find('td').eq(1).text();
        var productoPrecio = parseFloat($(this).closest('tr').find('td').eq(2).text());

        var uniqueKey = productoId + '-' + productoMarca + '-' + productoNombre;

        var productoEnPedido = $('#pedido-table tbody').find('tr[data-key="' + uniqueKey + '"]');
        if (productoEnPedido.length > 0) {
            var cantidadInput = productoEnPedido.find('.cantidad-input');
            var cantidadActual = parseInt(cantidadInput.val());
            var nuevaCantidad = cantidadActual + 1;
            cantidadInput.val(nuevaCantidad);

            var precioUnitario = parseFloat(productoEnPedido.find('.precio-unitario-input').val());
            var nuevoPrecioTotal = precioUnitario * nuevaCantidad;
            productoEnPedido.find('.precio-total').text(nuevoPrecioTotal.toFixed(2));
        } else {
            var nuevoProducto = `
                <tr data-key="${uniqueKey}" data-productoid="${productoId}">
                    <td>${productoNombre}</td>
                    <td>${productoMarca}</td>
                    <td><input type="number" class="cantidad-input" value="1" min="1"></td>
                    <td><input type="number" class="precio-unitario-input" value="${productoPrecio.toFixed(2)}" min="0"></td>
                    <td class="precio-total" data-precio-unitario="${productoPrecio.toFixed(2)}">${productoPrecio.toFixed(2)}</td>
                    <td><button type="button" class="btn btn-danger remove-producto">Eliminar</button></td>
                </tr>`;
            $('#pedido-table tbody').append(nuevoProducto);
        }

        recalcularTotalPedido();
    });

    $('#pedido-table').on('click', '.remove-producto', function() {
        $(this).closest('tr').remove();
        recalcularTotalPedido();
    });

    // Recalcular el precio total cuando se cambia el precio unitario o la cantidad
    $('#pedido-table').on('input', '.precio-unitario-input, .cantidad-input', function() {
        var row = $(this).closest('tr');
        var cantidad = parseInt(row.find('.cantidad-input').val());
        var precioUnitario = parseFloat(row.find('.precio-unitario-input').val());
        var nuevoPrecioTotal = precioUnitario * cantidad;

        row.find('.precio-total').text(nuevoPrecioTotal.toFixed(2));
        recalcularTotalPedido();
    });

    // Función para recalcular el total del pedido
    function recalcularTotalPedido() {
        var totalPedido = 0;
        $('#pedido-table tbody tr').each(function() {
            var precioTotal = parseFloat($(this).find('.precio-total').text());
            totalPedido += precioTotal;
        });
        $('#total-pedido').text(totalPedido.toFixed(2));
    }

    // Finalizar el pedido y enviar los datos al backend
    $('#finalizar-pedido').on('click', function() {
        let pedidoData = {
            vendedor_id: $('#vendedor').val(),
            cliente_id: $('#cliente').val(),
            productos: [],
            total: parseFloat($('#total-pedido').text())
        };

        $('#pedido-table tbody tr').each(function() {
            let productoId = $(this).data('productoid');
            let cantidad = parseInt($(this).find('.cantidad-input').val());
            let precioUnitario = parseFloat($(this).find('.precio-unitario-input').val());

            if (productoId) {
                pedidoData.productos.push({ producto_id: productoId, cantidad: cantidad, precio_unitario: precioUnitario });
            }
        });

        enviarPedidoAlBackend(pedidoData);
    });

    function enviarPedidoAlBackend(pedidoData) {
        $.ajax({
            url: '/pedidos/crear/',
            method: 'POST',
            data: JSON.stringify(pedidoData),
            contentType: 'application/json',
            success: function(response) {
                alert('Pedido creado exitosamente');
                location.reload;
            },
            error: function(xhr) {
                console.error('Error al crear el pedido:', xhr);
                var errorMessages = xhr.responseJSON.errors || [xhr.responseJSON.error || 'Hubo un error al crear el pedido'];
                alert(errorMessages.join('\n'));
            }
        });
    }

    // Cancelar el pedido
    $('#cancelar-pedido').click(function() {
        location.reload;
        // Aquí podríamos resetear el formulario o redirigir a otra página
    });
});
