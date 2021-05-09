// tabs

window.onload = function () {
	var tabLinks = document.querySelectorAll(".tablinks");
	var tabContent = document.querySelectorAll(".tabcontent");
	function openTabs(el) {
		var btnTarget = el.currentTarget;
		var country = btnTarget.dataset.country;

		tabContent.forEach(function (el) {
			el.classList.remove("active");
		});

		tabLinks.forEach(function (el) {
			el.classList.remove("active");
		});

		document.querySelector("#" + country).classList.add("active");

		btnTarget.classList.add("active");
	}
	tabLinks.forEach(function (el) {
		el.addEventListener("click", openTabs);
	});
}

	
