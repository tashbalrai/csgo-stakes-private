/**
 * Created by amitava on 07/09/17.
 */
$(function () {

  $('#user-details-modal').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget) // Button that triggered the modal
    var id = button.data('id') // Extract info from data-* attributes
    var modal = $(this);
    modal.find('.modal-content').load(baseUrl + '/users/'+id);
  })

  $('.delete-ticket').on('click', function () {
    var $btn = $(this);
    var id = $btn.data('id');

    if(confirm('Close ticket?')) {
      $.ajax(baseUrl + '/tickets/'+id, {
        method: 'delete'
      }).then(function () {
        window.location = baseUrl + '/tickets';
      });
    }

  })
});