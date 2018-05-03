//functions to handle form-wizard
(function($) {
  $(document).ready(function() {
      //Add blue animated border and remove with condition when focus and blur
      if ($('.fg-line')[0]) {
          $('body').on('focus', '.form-control', function() {
              $(this).closest('.fg-line').addClass('fg-toggled');
          })

          $('body').on('blur', '.form-control', function() {
              var p = $(this).closest('.form-group');
              var i = p.find('.form-control').val();

              if (p.hasClass('fg-float')) {
                  if (i.length === 0) {
                      $(this).closest('.fg-line').removeClass('fg-toggled');
                  }
              } else {
                  $(this).closest('.fg-line').removeClass('fg-toggled');
              }
          });
      }

      //Add blue border for pre-valued fg-flot text feilds
      if ($('.fg-float')[0]) {
          $('.fg-float .form-control').each(function() {
              var i = $(this).val();

              if (!i.length === 0) {
                  $(this).closest('.fg-line').addClass('fg-toggled');
              }

          });
      }


      /*   Form Wizard Functions  */
      /*--------------------------*/
      _handleTabShow = function(tab, navigation, index, wizard) {
          var total = navigation.find('li').length;
          var current = index + 0;
          var percent = (current / (total - 1)) * 100;
          var percentWidth = 100 - (100 / total) + '%';

          navigation.find('li').removeClass('done');
          navigation.find('li.active').prevAll().addClass('done');

          wizard.find('.progress-bar').css({
              width: percent + '%'
          });
          $('.form-wizard-horizontal').find('.progress').css({
              'width': percentWidth
          });
      };

      _updateHorizontalProgressBar = function(tab, navigation, index, wizard) {
          var total = navigation.find('li').length;
          var current = index + 0;
          var percent = (current / (total - 1)) * 100;
          var percentWidth = 100 - (100 / total) + '%';

          wizard.find('.progress-bar').css({
              width: percent + '%'
          });
          wizard.find('.progress').css({
              'width': percentWidth
          });
      };

      /* Form Wizard - Example 1  */
      /*--------------------------*/
      $('#formwizard_simple').bootstrapWizard({
          onTabShow: function(tab, navigation, index) {
              _updateHorizontalProgressBar(tab, navigation, index, $('#formwizard_simple'));
          }
      });

      /* Form Wizard - Example 2  */
      /*--------------------------*/

      $('#formwizard_validation').bootstrapWizard({
          onNext: function(tab, navigation, index) {
              var form = $('#formwizard_validation').find("form");
              var valid = true;

              if (index === 1) {
                  var fname = form.find('#firstname');
                  var lastname = form.find('#lastname');

                  if (!fname.val()) {
                      swal("You must enter your first name!");
                      fname.focus();
                      return false;
                  }

                  if (!lastname.val()) {
                      swal("You must enter your last name!");
                      lastname.focus();
                      return false;
                  }
              }

              if (!valid) {
                  return false;
              }
          },
          onTabShow: function(tab, navigation, index) {
              _updateHorizontalProgressBar(tab, navigation, index, $('#formwizard_validation'));
          }
      });

  });
})(jQuery);
