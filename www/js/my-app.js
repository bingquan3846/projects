// Initialize your app
var myApp = new Framework7({
    material: true,
    preroute : function(view, options){
        if (!Template7.global.login) {
            myApp.alert(' Über die Einstellungen können Sie Filter für Ihre Wunschprojekte setzen und einen individuellen Bewerbungstext definieren. Bitte loggen Sie sich ein um dieses Feature zu nutzen.', 'Freelancermap');
            return false; //required to prevent default router action
        }
    }
});

// Export selectors engine
var $$ = Dom7;

// Add view
var mainView = myApp.addView('.view-main', {
    // Because we use fixed-through navbar we can enable dynamic navbar
    dynamicNavbar: true,

    domCache: true
});



// ajax request url
var domain = "http://dev.freelancermap.de";
var loginUrl = domain + "/inderovrx.php?module=api&func=login";
var projectsUrl = domain + "/index.php?module=api&func=projects&local=0";
var applyUrl = domain + "/index.php?module=api&func=apply";
var wishListUrl = domain + "/index.php?module=api&func=wishList";
var projectContentUrl = domain + "/index.php?module=api&func=showContent";
var pageNum = 1;
var projectsTemplate = $$('script#projects').html();
var compiledProjectsTemplate = Template7.compile(projectsTemplate);
Template7.global = {
    login: false
};

$$('#notLogin').on('click', function(){
    $$('#login-close').click();
    refreshSlider();
});

$$('#login').on('click', function(){
    var username = $$("input[name='username']").val();
    var password = $$("input[name='password']").val();
    if(username == ''){
        myApp.alert('Username', 'freelancermap');
        return;
    }
    if(password == ''){
        myApp.alert('Passwort', 'freelancermap');
        return;
    }

    myApp.showIndicator();
    $$.ajax({
        url: loginUrl,
        method: 'POST' ,
        data: { username: username, password: password },
        success: function(data){
            data = JSON.parse(data);
            if(data.error){
                myApp.hideIndicator();
                myApp.alert('Profil Fehler', 'Freelancermap login');
            }else{
                myApp.hideIndicator();
                myApp.ls['uid'] = data.uid;
                myApp.ls['token'] = data.token;
                myApp.ls['firstname'] = data.firstName;
                myApp.ls['lastname'] = data.lastName;
                Template7.global.login = true;
                welcomeScreen(myApp);
                $$('#login-close').click();
            }
        },
        error: function(data){
            myApp.hideIndicator();
            myApp.alert('Fehler', 'Freelancermap login');
        }
    });
});

$$('#logo').on("click",function(){
    refreshSlider();
});


var slider = new Swiper('.swiper-container', {
    loop: false,
    onTouchEnd : function(slider,event){
        if(slider.swipeDirection == 'next' && slider.isEnd){
            getProjects(pageNum,true);
        }

    }
});

// login
if(typeof myApp.ls['token'] ==  'undefined'){
    myApp.loginScreen();
}else{
    refreshSlider();
    Template7.global.login = true;
}

// functions
function refreshSlider(){
    pageNum = 1;
    slider.removeAllSlides();
    getProjects(pageNum, false);
    slider.slideTo(0);
}

myApp.onPageInit('positive', function (page) {

    $$('input[name="addKeyword"]').blur(function(e){

        if($$(this).val().trim() != ''){
            var target = $$(this).data('target');
            var keywordsNum = $$('#' + target + 'List').find('.swipeout').length;
            var liHtml = '<li class="swipeout" id="new' + target +(keywordsNum + 1) +'"> <label class="label-checkbox item-content swipeout-content"><input type="checkbox" name="' + target + '" value="'+ $$(this).val() + '" checked="true"><div class="item-inner"><div class="item-title"> ' + $$(this).val() + ' </div></div></label><div class="swipeout-actions-right"> <a href="#" class="swipeout-delete">löschen</a></div></li>'

            $$('#' + target + 'List').append(liHtml);
            $$(this).val('');
            myApp.formStoreData(target+'Keywords', myApp.formToJSON ('#'+target+'Keywords'));
            refreshSlider();
            addClickEventToDeleteKeywords('#new' + target +(keywordsNum + 1) );
        }
    });

    initPositiveKeywordsForm();

});

myApp.onPageInit('negative', function (page) {

    $$('input[name="addKeyword"]').blur(function(e){

        if($$(this).val().trim() != ''){
            var target = $$(this).data('target');
            var keywordsNum = $$('#' + target + 'List').find('.swipeout').length;
            var liHtml = '<li class="swipeout" id="new' + target + (keywordsNum + 1) +'"> <label class="label-checkbox item-content swipeout-content"><input type="checkbox" name="' + target + '" value="'+ $$(this).val() + '" checked="true"><div class="item-inner"><div class="item-title"> ' + $$(this).val() + ' </div></div></label><div class="swipeout-actions-right"> <a href="#" class="swipeout-delete">löschen</a></div></li>'
            $$('#' + target + 'List').append(liHtml);
            $$(this).val('');
            myApp.formStoreData(target+'Keywords', myApp.formToJSON ('#'+target+'Keywords'));
            refreshSlider();
            addClickEventToDeleteKeywords('#new' + target +(keywordsNum + 1), target );
        }

    });

    initNegativeKeywordsForm();
});


myApp.onPageInit('settings', function(page){
    // replace template with firstname and lastname
    if(myApp.ls['uid']){
        var template = $$('#settings-form textarea[name="template"]').val();
        var newTemplate = template.replace('{NAME DES USERS}', myApp.ls['firstname'] + ' ' +  myApp.ls['lastname']);
        $$('#settings-form textarea[name="template"]').val(newTemplate);
        myApp.formStoreData('settings-form', myApp.formToJSON ('#settings-form'));
    }

});


function getProjects(page, next){
    myApp.showIndicator();
    var formData = (myApp.ls['f7form-settings-form']) ? myApp.ls['f7form-settings-form'] : '{ \"category\":[1],\"state\":[], \"country\":[]}';
    var positiveKeywords = (myApp.ls['f7form-positiveKeywords']) ? myApp.ls['f7form-positiveKeywords'] : '{}';
    var negativeKeywords = (myApp.ls['f7form-negativeKeywords']) ? myApp.ls['f7form-negativeKeywords'] : '{}';
    $$.ajax({
        url: projectsUrl + '&uid=' + myApp.ls['uid'] + '&page=' + page + '&token=' + myApp.ls['token'],
        type: "GET",
        data: {params: JSON.parse(formData), keywords: [JSON.parse(positiveKeywords) , JSON.parse(negativeKeywords)] },
        success: function(data, textStatus ){
            if(data != ''){
                data = JSON.parse(data);
                myApp.hideIndicator();
                if(data.projects.length){
                    var previousSize = slider.slides.length;
                    var itemHTML = compiledProjectsTemplate({
                            projects: data.projects}
                    );
                    slider.appendSlide(itemHTML);
                    slider.updateSlidesSize();
                    var currentSize = slider.slides.length;
                    //go to next page when none displayed
                    if(previousSize == currentSize){
                        pageNum = pageNum + 1;
                        getProjects(pageNum);
                    }
                    pageNum++;
                    if( next ){
                        slider.slideTo(previousSize);
                    }

                }else{
                    if(!next){
                        myApp.alert('Zu Ihren Suchparametern konnten wir leider keine Projekte finden','Freelancermap');
                    }else{
                        refreshSlider();
                    }
                }
            }
        },
        error: function(){
            myApp.hideIndicator();
            myApp.loginScreen();
        }
    });
}

function apply(projectId, poster, obj){
    if((myApp.ls['f7form-settings-form'])){
        var template = JSON.parse(myApp.ls['f7form-settings-form']).template;
        var attachment = JSON.parse(myApp.ls['f7form-settings-form']).attachment[0];
    }else{
        var template = "[Anrede],\nich interessiere mich für die ausgeschriebene Position. Bitte\nnehmen Sie zu mir Kontakt auf um alles weitre zu besprechen.\nMit freundlichen Grüßen\n" + myApp.ls['firstname'] + ' ' +  myApp.ls['lastname'];
        var attachment = 0;
    }
    $$.ajax({
        url: applyUrl,
        type: "GET",
        data: {projectId: projectId, uid: myApp.ls['uid'], token: myApp.ls['token'], poster : poster, template: template, attachment: attachment},
        success: function(data){
            data = JSON.parse(data);
            if( data.error == 0){
                myApp.alert("Sie haben sich erfolgreich auf die Stelle beworben.", "Freelancermap");
                $$(obj).parent().html('<i class="fa fa-envelope-o"></i>&nbsp;beworben');
            }else if(data.error == -1){
                myApp.alert("Bitte legen Sie online ein Profil an um sich auf dieses Projekt zu bewerben.", "Freelancermap");
            }else{
                myApp.alert("blocked oder Fehler", "Freelancermap");
            }
        }
    });
}

function addWishlist(projectId, obj){
    $$.ajax({
        url: wishListUrl,
        type: "GET",
        data: {projectId: projectId, uid: myApp.ls['uid'], token: myApp.ls['token']},
        success: function(data){
            data = JSON.parse(data);
            if( !data.error ){
                $$(obj).parent().html('<i class="fa fa-star"></i>&nbsp;gemerkt');
            }
        }
    });
}

function showContent(projectId, obj){
    if($$(obj).next().html().trim() == ''){
        $$.ajax({
            url: projectContentUrl,
            type: "GET",
            data: {projectId: projectId, uid: myApp.ls['uid'], token: myApp.ls['token']},
            success: function(data){
                data = JSON.parse(data);
                if( !data.error ){

                    $$(obj).next().html(data.content)
                        .css('height', 'auto');
                }
            }
        });
    }
}

function initPositiveKeywordsForm(){
    if(myApp.ls['f7form-positiveKeywords']){
        var pKeywords = JSON.parse(myApp.ls['f7form-positiveKeywords']);
        if(pKeywords.positive){
            for( i = 0; i < pKeywords.positive.length; i++){
                var target = 'positive';
                var liHtml = '<li class="swipeout"> <label class="label-checkbox item-content swipeout-content"><input type="checkbox" name="' + target + '" value="'+ pKeywords.positive[i] + '" checked="true"><div class="item-inner"><div class="item-title"> ' + pKeywords.positive[i] + ' </div></div></label>       <div class="swipeout-actions-right"> <a href="#" class="swipeout-delete">löschen</a></div></li>'
                $$('#' + target + 'List').append(liHtml);
            }
            addClickEventToDeleteKeywords('#' + target + 'List', target);
        }
    }

}

function initNegativeKeywordsForm(){
    if(myApp.ls['f7form-negativeKeywords']){
        var nKeywords = JSON.parse(myApp.ls['f7form-negativeKeywords']);
        if(nKeywords.negative){
            for( i = 0; i < nKeywords.negative.length; i++){
                var target = 'negative';
                var liHtml = '<li class="swipeout"> <label class="label-checkbox item-content swipeout-content"><input type="checkbox" name="' + target + '" value="'+ nKeywords.negative[i] + '" checked="true"><div class="item-inner"><div class="item-title"> ' + nKeywords.negative[i] + ' </div></div></label>       <div class="swipeout-actions-right"> <a href="#" class="swipeout-delete">löschen</a></div></li>'
                $$('#' + target + 'List').append(liHtml);
            }
            addClickEventToDeleteKeywords('#' + target + 'List', target);
        }

    }

}

function addClickEventToDeleteKeywords(obj, target){
    $$(obj).find(".swipeout-delete").each(function(){
        $$(this).once('click', function (e) {
            myApp.formStoreData(target + 'Keywords', myApp.formToJSON ('#' + target + 'Keywords'));
            $$('.swipeout').removeAttr('id');
            refreshSlider();
        });
    });
}

function welcomeScreen(myapp){
    var options = {
            'bgcolor': '#0da6ec',
            'fontcolor': '#fff',
            'onOpened': function () {
                console.log("welcome screen opened");
            },
            'onClosed': function () {
                refreshSlider();
            }
        },
        welcomescreen_slides = [
            {
                id: 'slide0',
                picture: '<div class="tutorialicon">♥</div>',
                text: '<p>Herzlich Willkommen zu unserer App. Hier finden Sie aktuelle Projektangebote und können sich mit nur einem Klick bewerben.</p><p>Unter dem Punkt "Einstellungen" können Sie einen Suchfilter für die Projekte setzen und einen Standardtext angeben mit dem Sie sich auf die Projekte bewerben.</p>'
            },
            {
                id: 'slide2',
                picture: '<div class="tutorialicon">☆</div>',
                text: '<a class="tutorial-close-btn" href="#">start</a>'
            }
        ],
        welcomescreen = myapp.welcomescreen(welcomescreen_slides, options);

    $$(document).on('click', '.tutorial-close-btn', function () {
        welcomescreen.close();
    });
}




