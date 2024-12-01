let timeOutFavorite = true;
let Favorite_text;
let Personal_text;

function loadSelectRaceVehicle() {
	$.post(`https://${GetParentResourceName()}/SelectVehicleCam`, JSON.stringify({}), function () {
		loadVehicleCategories().done(() => {
			$('.vehicles .category').removeClass('selected');
			$('.vehicles .category:first-child').addClass('selected');
			// $(".vehicle-stats").removeClass("show");
			postGetVehicles(Favorite_text).done(function () {
				eventsRaceVehicle();
				$('.vehicle-list').delay(1000).fadeIn(500);
			});
			$('.vehicle-stats').removeClass('show');
			$('.vehicles').fadeIn(300);
			$('.vehicles .category')
				.off('click')
				.on('click', function () {
					if (!$(this).hasClass('selected')) {
						$('.vehicles .category').removeClass('selected');
						$(this).addClass('selected');
						const category = $(this).text();
						$('.vehicle-list')
							.removeClass('fade-in-right')
							.addClass('fade-out-left')
							.fadeOut(500, function () {
								//POST CARGA
								postGetVehicles(category.trim()).done(function () {
									eventsRaceVehicle();
									$('.vehicle-list')
										.removeClass('fade-out-left')
										.addClass('fade-in-right')
										.fadeIn(500);
								});
							});
					}
				});
		});
	});
}

function loadVehicleCategories() {
	return $.post(
		`https://${GetParentResourceName()}/GetCategoryList`,
		JSON.stringify({}),
		function (data) {
			if (data) {
				Favorite_text = data.translatedText["Favorite"];
				Personal_text = data.translatedText["Personal"];
				$('.vehicles .categories').html(`
				<div class="category selected">
					${Favorite_text}
				</div>
				<div class="category selected">
					${Personal_text}
				</div>
			`);
				Object.entries(data.CategoryList).forEach((category) => {
					$('.vehicles .categories').append(`
					<div class="category">
						${category[1]}
					</div>
					`);
				});
			}
		}
	);
}

function postGetVehicles(category) {
	return $.post(
		`https://${GetParentResourceName()}/GetCategory`,
		JSON.stringify({ category: category }),
		function (data) {
			if (data) {
				let htmlCategory = '';
				$('.vehicles-container').html('');
				data.forEach((car) => {
					let favorite = '<i class="fa-regular fa-star gradient-text"></i>';
					if (car.favorite || category == Favorite_text) {
						favorite = '<i class="fa-solid fa-star gradient-text"></i>';
						car.favorite = true;
					}
					if (category == Favorite_text) {
						htmlCategory = `<div class="category-name">${car.category}</div>`;
					}

					$('.vehicles-container').append(`
					<div class="vehicle" model="${car.model}">
						<div class="w-100 vehicle-button d-flex align-items-center">
							<i class="fas fa-car gradient-text"></i>
							<div class="d-inline-block">
								${htmlCategory}
								<div class="v-tag">${car.label}</div>
							</div>
						</div>
						<div class="favorite" favorite="${car.favorite}">
							${favorite}
						</div>
					</div>
					`);
				});
			}
		}
	).promise();
}

function eventsRaceVehicle() {
	setTimeout(() => {
		$('.vehicles-container').scrollTop(0);
		eventsSounds();
	}, 5);
	$('#search-vehicle').val('');
	$('.vehicle-button')
		.off('click')
		.on('click', function () {
			if (!$(this).parent().hasClass('selected')) {
				$('.vehicle').removeClass('selected');
				$(this).parent().addClass('selected');

				$.post(
					`https://${GetParentResourceName()}/PreviewVeh`,
					JSON.stringify({ model: $(this).parent().attr('model') }),
					function (handling) {
						$('.traction').css('width', handling.traction + '%');
						$('.speed').css('width', handling.maxSpeed + '%');
						$('.acceleration').css('width', handling.acceleration + '%');
						$('.braking').css('width', handling.breaking + '%');
						$('.vehicle-stats').addClass('show').show();
					}
				);
			}
		});

	$('.favorite')
		.off('click')
		.on('click', function () {
			let category = $('.vehicles .category.selected').text().trim();
			const model = $(this).parent().attr('model');
			const label = $(this).parent().find('.v-tag').text();
			if (timeOutFavorite) {
				timeOutFavorite = false;
				setTimeout(() => {
					timeOutFavorite = true;
				}, 1000);
				if ($(this).attr('favorite') == 'true') {
					$(this).attr('favorite', false);
					$(this).html('<i class="fa-regular fa-star gradient-text"></i>');

					if (category == Favorite_text) {
						category = $(this).parent().find('.category-name').text().trim();
						$(this)
							.parent()
							.addClass('fade-out-left')
							.fadeOut(300, function () {
								$(this).remove();
							});
					}

					$.post(`https://${GetParentResourceName()}/RemoveFromFavorite`, JSON.stringify({ model: model, category: category }));
				} else {
					$(this).attr('favorite', true);
					$(this).html('<i class="fa-solid fa-star gradient-text"></i>');
					$.post(`https://${GetParentResourceName()}/AddToFavorite`, JSON.stringify({ model: model, label: label, category: category }));
				}
			}
		});

	$('#btn-accept-vehicle')
		.off('click')
		.on('click', function () {
			if ($('.vehicle.selected').length > 0) {
				$.post(
					`https://${GetParentResourceName()}/SelectVeh`,
					JSON.stringify({
						model: $('.vehicle.selected').attr('model'),
						label: $('.vehicle.selected').find('.v-tag').text()
					}),
					function (data) {
						$('.vehicles').fadeOut(500, function () {
							$('.room').removeClass('animate__fadeOutUp').addClass('animate__fadeInDown');
							if (data.inroom) {
								$('.room').fadeIn(500);
							} else {
								$('.room').fadeOut(500);
							}
						});
					}
				);
				$('.vehicle-stats').removeClass('show');
				$('.vehicle').removeClass('selected');
			}
		});

	$('.vehicle-list .input-search')
		.off('keyup')
		.on('keyup', function (e) {
			if (e.which === 13) {
				let value = $(this).val().toLowerCase();
				$('.vehicle').filter(function () {
					$(this).toggle(
						$(this).find('.category-name').text().toLowerCase().indexOf(value) > -1 ||
						$(this).find('.v-tag').text().toLowerCase().indexOf(value) > -1
					);
				});
			}
		});
}