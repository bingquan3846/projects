// Initialize your app
var myApp = new Framework7({
    init: true
});

myApp.initFormsStorage('.page');

// Export selectors engine
var $$ = Dom7;

// Add view
var mainView = myApp.addView('.view-main', {
    // Because we use fixed-through navbar we can enable dynamic navbar
    dynamicNavbar: true,
    domCache: true
});

myApp.initFormsStorage('.page');

console.log(myApp.ls);

// ajax request url
var loginUrl = "http://dev.freelancermap.de/index.php?module=user&func=appLogin&processmode=ajax"
var projectsUrl = "http://dev.freelancermap.de/index.php?module=projekt&func=appProjects&processmode=ajax"
var pageNum = 0;


// login
var isLogin = true;
var uid = 12113;
if(!isLogin){
    //myApp.popup('.popup-login');
    myApp.loginScreen();
}

$$('#login').on('click', function(){
    var postdata = {};
    postdata.username = $$('input[name="username"]');
    postdata.password = $$('input[name="password"]');
    myApp.showIndicator();
    $$.ajax({
        url: loginUrl,
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(postdata),
        headers: {"Access-Control-Allow-Origin":'*'},
        success: function(data, textStatus ){
            myApp.hideIndicator();
            uid = data;
            console.log(uid);
            getProjects(pageNum);
            myApp.alert('success', 'Freelancermap login');
        }
    });
    isLogin = true;
    $$('#login-close').click();
});


var projectsTemplate = $$('script#projects').html();
var compiledProjectsTemplate = Template7.compile(projectsTemplate);



var slider = new Swiper('.swiper-container', {
    loop: false,
    onSlideNextEnd: function(slider, event){
        if(slider.swipeDirection == 'next' && slider.isEnd){
            getProjects(pageNum);
        }
    }
});



function getProjects(page, next){
    myApp.showIndicator();
    var formData = myApp.formToJSON('#settings-form');
    console.log(formData);
    $$.ajax({
        url: projectsUrl + '&uid=' + uid + '&page=' + page,
        type: "POST",
        success: function(data, textStatus ){
            if(data != ''){
                myApp.hideIndicator();
                var itemHTML = compiledProjectsTemplate({
                        projects: JSON.parse(data)}
                );

                slider.appendSlide(itemHTML);
                slider.updateSlidesSize();
                if(next){
                    slider.slideNext();
                }
                pageNum++;
            }
        }
    });
}

function apply(projectId){
    console.log(projectId);
    console.log(uid);
    myApp.alert('Bewerbung','Freelancermap');
}

function addWishlist(projectId){
    console.log(projectId);
    console.log(uid);
    myApp.alert('Merken','Freelancermap');
}

function showWishlist(){
    myApp.alert("Merkliste", "Freelancermap");
}

myApp.onPageInit('setting', function (page) {
    // run createContentPage func after link was clicked
    $$("#settings-form").attr('action', projectsUrl + '&uid=' + uid + '&page=0&init=true' );
});

initKeywordsForm();

$$('#settings-form').on('submitted', function (e) {

    myApp.showIndicator();
    var itemHTML = compiledProjectsTemplate({
            projects: JSON.parse(e.detail.data)}
    );
    slider.removeAllSlides();
    slider.appendSlide(itemHTML);
    slider.updateSlidesSize();
    myApp.hideIndicator();
});

function initKeywordsForm(){
    var pKeywords = JSON.parse(myApp.ls['f7form-positiveKeywords']);
    var nKeywords = JSON.parse(myApp.ls['f7form-negativeKeywords']);

    if(pKeywords.positive){
        for( i = 0; i < pKeywords.positive.length; i++){
            var target = 'positive';
            var liHtml = '<li class="swipeout"> <label class="label-checkbox item-content swipeout-content"><input type="checkbox" name="' + target + '" value="'+ pKeywords.positive[i] + '" checked="true"><div class="item-media"><i class="icon icon-form-checkbox"></i></div><div class="item-inner"><div class="item-title"> ' + pKeywords.positive[i] + ' </div></div></label>       <div class="swipeout-actions-right"> <a href="#" class="swipeout-delete">löschen</a></div></li>'
            $$('#' + target + 'List').append(liHtml);
        }
    }
    if(nKeywords.negative){
        for( i = 0; i < nKeywords.negative.length; i++){
            var target = 'negative';
            var liHtml = '<li class="swipeout"> <label class="label-checkbox item-content swipeout-content"><input type="checkbox" name="' + target + '" value="'+ nKeywords.negative[i] + '" checked="true"><div class="item-media"><i class="icon icon-form-checkbox"></i></div><div class="item-inner"><div class="item-title"> ' + nKeywords.negative[i] + ' </div></div></label>       <div class="swipeout-actions-right"> <a href="#" class="swipeout-delete">löschen</a></div></li>'
            $$('#' + target + 'List').append(liHtml);
        }
    }
}

$$('input[name="addKeyword"]').keypress(function(e){
    var key = e.which || e.keyCode;
    console.log(window.localStorage);
    if(key == 13){
        var target = $$(this).data('target');
        var liHtml = '<li class="swipeout"> <label class="label-checkbox item-content swipeout-content"><input type="checkbox" name="' + target + '" value="'+ $$(this).val() + '" checked="true"><div class="item-media"><i class="icon icon-form-checkbox"></i></div><div class="item-inner"><div class="item-title"> ' + $$(this).val() + ' </div></div></label>       <div class="swipeout-actions-right"> <a href="#" class="swipeout-delete">löschen</a></div></li>'
        $$('#' + target + 'List').append(liHtml);
        $$(this).val('');
        myApp.formStoreData(target+'Keywords', myApp.formToJSON ('#'+target+'Keywords'));
    }

});


