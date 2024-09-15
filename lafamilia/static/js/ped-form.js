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
            $('#productos-table').DataTable({
                destroy: true,  // Esto destruye cualquier instancia anterior antes de volver a inicializar
                language: { url: '//cdn.datatables.net/plug-ins/2.1.5/i18n/es-ES.json' }
            });
        },
        error: function (error) {
            console.error('Error al obtener los datos iniciales:', error);
        }
    });

    $('#cliente').select2();

    $('#all-btn').on('click', function() {
        var table = $('#productos-table').DataTable();
        table.search('').columns().search('').draw();
    });

    $('#marca-buttons').on('click', '.marca-btn', function() {
        var selectedMarca = $(this).attr('data-marca');
        var table = $('#productos-table').DataTable();
        table.column(1).search(selectedMarca).draw(); // Asume que la marca está en la segunda columna (índice 1)
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
            productoEnPedido.find('.precio-total').text(nuevoPrecioTotal.toFixed(2));
        } else {
            var nuevoProducto = '<tr data-key="' + uniqueKey + '" data-productoid="' + productoId + '">';
            nuevoProducto += '<td>' + productoMarca + '</td>';
            nuevoProducto += '<td>' + productoNombre + '</td>';
            nuevoProducto += '<td><input type="number" class="cantidad-input" value="1" min="1"></td>';
            nuevoProducto += '<td class="precio-unitario">' + productoPrecio + '</td>';
            nuevoProducto += '<td class="precio-total" data-precio-unitario="' + productoPrecio.toFixed(2) + '">' + productoPrecio.toFixed(2) + '</td>';
            nuevoProducto += '<td><button type="button" class="btn btn-danger remove-producto">Eliminar</button></td>';
            nuevoProducto += '</tr>';

            $('#pedido-table tbody').append(nuevoProducto);
        }

        // Recalcular el total del pedido
        recalcularTotalPedido();
    });

    $('#pedido-table').on('click', '.remove-producto', function() {
        $(this).closest('tr').remove();
        recalcularTotalPedido();
    });

    // Manejar el cambio en la cantidad de productos desde el input
    $('#pedido-table').on('input', '.cantidad-input', function() {
        var nuevaCantidad = parseInt($(this).val());
        var productoPrecio = parseFloat($(this).closest('tr').find('.precio-total').data('precio-unitario'));

        // Actualizar el precio total del producto
        var nuevoPrecioTotal = productoPrecio * nuevaCantidad;
        $(this).closest('tr').find('.precio-total').text(nuevoPrecioTotal.toFixed(2));

        // Recalcular el total del pedido
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
            let precioUnitario = parseFloat($(this).find('.precio-unitario').text());
    
            if (productoId) {
                pedidoData.productos.push({ producto_id: productoId, cantidad: cantidad,  precio_unitario: precioUnitario });
            }
        });
    
        return enviarPedidoAlBackend(pedidoData);

    
    });

    function enviarPedidoAlBackend(pedidoData) {
        $.ajax({
            url: '/pedidos/crear/',
            method: 'POST',
            data: JSON.stringify(pedidoData),
            contentType: 'application/json',
            success: function(response) {
                alert('Pedido creado exitosamente');
                window.location.reload();
            }
            ,
            error: function(xhr) {
                console.error('Error al crear el pedido:', xhr);
                // Accede a responseJSON para obtener el contenido del error
                var errorMessages = xhr.responseJSON.errors || [xhr.responseJSON.error || 'Hubo un error al crear el pedido'];
                alert(errorMessages.join('\n'));
            }
        });
    }
    

    // Cancelar el pedido
    $('#cancelar-pedido').click(function() {
        window.location.reload();
        // Aquí podríamos resetear el formulario o redirigir a otra página
    });

});
