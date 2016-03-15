// Initialize your app
var myApp = new Framework7({
});

// Export selectors engine
var $$ = Dom7;

// Add view
var mainView = myApp.addView('.view-main', {
    // Because we use fixed-through navbar we can enable dynamic navbar
    dynamicNavbar: true
});

var settings = JSON.parse('{"positiveKeywords" : "", "negativeKewwords": "", "category": "default", "place": "", "template": "" }');
if(typeof(Storage)!=="undefined"){
    localStorage.setItem("settings",settings);
}

myApp.onPageInit('setting', function (page) {
    // run createContentPage func after link was clicked
    var formData = myApp.formToJSON('#settings-form');
    console.log(JSON.stringify(formData));
});

var isLogin = false;
if(!isLogin){
    //myApp.popup('.popup-login');
    myApp.loginScreen();
}

$$('#login').on('click', function(){
    isLogin = true;
    $$('#login-close').click();
});

var projectsTemplate = $$('script#projects').html();
var compiledProjectsTemplate = Template7.compile(projectsTemplate);
var ptrContent = $$('.pull-to-refresh-content');

ptrContent.on('refresh', function (e) {
    setTimeout(function () {

        ptrContent.find('.swiper-container')
            .css('visibility', 'hidden')
            .css('height', '0');

        var itemHTML = compiledProjectsTemplate({
                data: [{id: Math.random(), title: Math.random().toString(36).replace(/[^a-z]+/g, "").substr(0, 5)},{id: Math.random(),title: Math.random().toString(36).replace(/[^a-z]+/g, "").substr(0, 5)}]}
                );

        ptrContent.append(itemHTML);
        var slider = new Swiper('.swiper-container');

        myApp.pullToRefreshDone();
    }, 2000);
});

function apply(projectId){
    myApp.popup('.popup-apply');
    console.log(projectId);
}