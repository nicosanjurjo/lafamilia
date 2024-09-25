$(document).ready(function() {

    $('#myTable').DataTable({
        order: [[0, 'desc']] });

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
