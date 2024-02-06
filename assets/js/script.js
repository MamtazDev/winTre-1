console.log("IUBERNDA DEFAULT");
var url_page = window.location.host;
console.log("url_page", url_page);

if (url_page.includes("localhost")) {
  console.log("localhost test no IUBENDA");
} else {
  var iubenda_id = "1777511";
  var iubenda_cookie_id = "60508478";
  var iubenda_lang = "it";
  var iubenda_cookie_position = "float-bottom-center" || "float-bottom-center";

  var iubenda_text = `<br><br><strong style='font-size: 13px;'>Informativa sull'utilizzo dei cookie del browser</strong><br>
        <p style="text-align: justify;">Noi e terze parti selezionate utilizziamo cookie o tecnologie simili per finalità tecniche e, con il tuo consenso, anche per altre finalità come specificato nella %{cookie_policy_link}.
        Puoi liberamente prestare, rifiutare o revocare il tuo consenso, in qualsiasi momento.
        Puoi acconsentire all’utilizzo di tali tecnologie utilizzando il pulsante “ACCETTA E CHIUDI”.<br>
        Cliccando su 'Continua senza accettare' proseguirai la navigazione senza accettare i cookies di profilazione.</p>
    `;
  var iubenda_button_1 = "ACCETTA E CHIUDI";
  var iubenda_button_2 = "OPZIONI COOKIE";
  var iubenda_button_3 = "CONTINUA SENZA ACCETTARE";
  if ("it") {
    iubenda_lang = "it";
    if (iubenda_lang == "en") {
      iubenda_text = `<br><br><strong style='font-size: 13px;'>Use of cookies</strong><br>
                <p style="text-align: justify;">Selected third parties and us use cookies or similar technologies for functional reasons and, with your consent, for other purposes as specified in the %{cookie_policy_link}.
                If you click on "CONTINUE WITHOUT ACCEPTING" you will not consent to the profiling cookies and keep browsing.
                If you click on "ACCEPT AND CLOSE" you will consent to all cookies or similar technologies. If you click on "Cookie Settings" you will able to configure your choices granularly: in this regard, if you close this area without expressing any choices, you will continue browsing without accepting the cookies.<br>
                You may freely give, deny or withdraw your consent by accessing the "Cookie Settings" panel at any moment.</p>
            `;
      iubenda_button_1 = "ACCEPT AND CLOSE";
      iubenda_button_2 = "COOKIE SETTINGS";
      iubenda_button_3 = "CONTINUE WITHOUT ACCEPTING";
    } else if (iubenda_lang == "es") {
      iubenda_text = `<br><br><strong style='font-size: 13px;'>Uso de cookies</strong><br>
                <p style="text-align: justify;">Terceros seleccionados y nosotros utilizamos cookies o tecnologías similares por razones funcionales y, con tu consentimiento, para otros fines especificados en la %{cookie_policy_link}.
                Si haces clic en "CONTINUAR SIN ACEPTAR" no consentirás las cookies de perfil y seguirá navegando.
                Si haces clic en "ACEPTAR Y CERRAR" consentirás todas las cookies o tecnologías similares. Si haces sclic en "Configuración de las cookies" podrás configurar tus opciones de forma granular: en este sentido, si cierras esta área sin expresar ninguna opción, seguirás navegando sin aceptar las cookies.
                Puedes dar, denegar o retirar libremente tu consentimiento accediendo al panel "Configuración de cookies" en cualquier momento.</p>
            `;
      iubenda_button_1 = "ACEPTAR Y CERRAR";
      iubenda_button_2 = "CONFIGURACION DE COOKIE";
      iubenda_button_3 = "CONTINUAR SIN ACEPTAR";
    }
  }

  if (url_page.includes("landingpromo.it")) {
    console.log("landingpromo.it IUBENDA");
    iubenda_id = "1777511";
    iubenda_cookie_id = "60508478";
  } else if (url_page.includes("digital-promo.it")) {
    console.log("digital-promo.it IUBENDA");
    iubenda_id = "2399895";
    iubenda_cookie_id = "31040711";
  } else if (url_page.includes("landing-promo.it")) {
    console.log("landing-promo.it IUBENDA");
    iubenda_id = "2257777";
    iubenda_cookie_id = "69092642";
  } else if (url_page.includes("promo-landing.it")) {
    console.log("promo-landing.it IUBENDA");
    iubenda_id = "2462946";
    iubenda_cookie_id = "91929731";
  } else if (url_page.includes("pagepromo.it")) {
    console.log("pagepromo.it IUBENDA");
    iubenda_id = "2462947";
    iubenda_cookie_id = "30264432";
  } else if (url_page.includes("online-promo.it")) {
    console.log("online-promo.it IUBENDA");
    iubenda_id = "1777511";
    iubenda_cookie_id = "60508478";
  } else if (url_page.includes("promo-digital.it")) {
    console.log("promo-digital.it IUBENDA");
    iubenda_id = "2507736";
    iubenda_cookie_id = "97819420";
  } else if (url_page.includes("windtre-promozioni.it")) {
    console.log("windtre-promozioni.it IUBENDA");
    iubenda_id = "2650338";
    iubenda_cookie_id = "20557890";
  } else if (url_page.includes("vodafone-offerte.it")) {
    console.log("vodafone-offerte.it IUBENDA");
    iubenda_id = "2650339";
    iubenda_cookie_id = "29153249";
  } else if (url_page.includes("offerta-limitata.it")) {
    console.log("offerta-limitata.it IUBENDA");
    iubenda_id = "2650341";
    iubenda_cookie_id = "70045956";
  } else if (url_page.includes("promo-internet.it")) {
    console.log("promo-internet.it IUBENDA");
    iubenda_id = "2650340";
    iubenda_cookie_id = "88145817";
  } else if (url_page.includes("onlinepromodigital.com")) {
    console.log("onlinepromodigital.com IUBENDA");
    iubenda_id = "3186530";
    iubenda_cookie_id = "47875668";
  } else if (url_page.includes("ofertas-digital.es")) {
    console.log("ofertas-digital.es IUBENDA");
    iubenda_id = "3292796";
    iubenda_cookie_id = "67328107";
  } else if (url_page.includes("eolo-offertepartner.it")) {
    console.log("eolo-offertepartner.it IUBENDA");
    iubenda_id = "3254841";
    iubenda_cookie_id = "36922050";
  } else if (url_page.includes("sondaggionline-chatbot.it")) {
    console.log("sondaggionline-chatbot.it IUBENDA");
    iubenda_id = "3311532";
    iubenda_cookie_id = "43354482";
  } else if (url_page.includes("optimaitalia-partner.it")) {
    console.log("optimaitalia-partner.it IUBENDA");
    iubenda_id = "3390851";
    iubenda_cookie_id = "26700917";
  }

  console.log("iubenda_id", iubenda_id);
  console.log("iubenda_lang", iubenda_lang);
  console.log("iubenda_cookie_id", iubenda_cookie_id);

  var _iub = _iub || [];
  _iub.csConfiguration = {
    consentOnContinuedBrowsing: false,
    invalidateConsentWithoutLog: true,
    cookiePolicyInOtherWindow: true,
    lang: iubenda_lang,
    siteId: iubenda_id,
    cookiePolicyId: iubenda_cookie_id,
    preferenceCookie: {
      expireAfter: 180,
    },
    perPurposeConsent: true,
    banner: {
      content: iubenda_text,
      innerHtmlCloseBtn:
        "<strong style='font-size: 12px;border: 1px solid #fff;padding: 7px 13px;font-weight: 600;border-radius: 64px!important;'>" +
        iubenda_button_3 +
        "</strong>",
      closeButtonRejects: true,
      acceptButtonDisplay: true,
      customizeButtonDisplay: true,
      acceptButtonColor: "#0885e6",
      acceptButtonCaptionColor: "white",
      customizeButtonColor: "#0885e6",
      customizeButtonCaptionColor: "white",
      explicitWithdrawal: true,
      position: iubenda_cookie_position,
      textColor: "white",
      backgroundColor: "#333333",
      fontSize: "12px",
      fontSizeBody: "12px",
      acceptButtonCaption: iubenda_button_1,
      customizeButtonCaption: iubenda_button_2,
      backgroundOverlay: true,
    },
  };
}

// web config
var web_project_configuration = {
  click_url: { title: "", url: "" },
  conversation: {
    disableFirstTyping: false,
    disableTyping: false,
    disable_scroll: false,
    font_size: 16,
    font_weight: 100,
    bubble_border_rounded: true,
    info_text_color: "#000000",
    user: {
      background_color: "#FF6900",
      text_color: "#ffffff",
      border_color: "#FF6900",
      opacity: 1,
      _id: "5e441853b7500e8ec3abb3ba",
    },
    bot: {
      background_color: "#ffffff",
      text_color: "#000000",
      border_color: "#ffffff",
      opacity: 1,
      _id: "5e441853b7500e8ec3abb3bb",
    },
    animation: {
      _id: "624d4aa5c1fb4350574badd8",
      timing: {
        message_interval: 600,
        bubble_opacity: 400,
        bubble_entrance_duration: 200,
        bubble_entrance_direction: "left",
        bubble_entrance_easing: "easeInOutQuad",
        dot_velocity: 800,
        bubble_text_content_expand: 100,
        bubble_text_content_opacity: 150,
        bubble_content_visibility: 250,
        _id: "624d4aa5c1fb4350574badd9",
      },
    },
  },
  description: "",
  confirm_closing: true,
  ask_notification: false,
  initial_messages: ["Hey tu!", "Sì, sto parlando proprio con te"],
  context_messages: ["Hey!", "Ricordi che stavamo già parlando?"],
  error_messages: ["Scusa, non ho capito! Prova a ripetere..."],
  fallback_messages: ["Scusa, non ho capito! Prova a ripetere..."],
  input_placeholder: "Scrivimi qualcosa...",
  avatar_image: "",
  anchor_mobile_image: "",
  device: "desktop",
  type: "landing",
  chat_overlay: false,
  _id: "65a11ee031e30ad2a9b9ca0f",
  cookie: {
    iubenda: {
      flag: true,
      lang: "it",
      site_id: null,
      cookie_id: null,
      cookiePolicyUrl: null,
      iubenda_cookie_position: "float-bottom-center",
    },
  },
  widget: {
    multiple: false,
    targets: [],
    type: "chat",
    subtype: "standard",
    welcome_message: "",
    open_chat_button_color: "#ffffff",
    open_chat_button_color_fill: "#000",
    title: "",
    background_color: "#000000",
    background_opacity: 1,
    popup_image: "",
    close_button_color: "#ffffff",
    video_open_button_type: "round",
    main_color: "#43d3d4",
    secondary_color: "#ffffff",
    video_preview_url: "",
    video_preview_color: "#ffffff",
    video_transition_type: "slideUp",
    video_button_layout: "standard",
    show_open_widget_button: false,
    _id: "5e441853b7500e8ec3abb3b2",
    whitelist_url: [],
    popup: { _id: "624d4aa5c1fb4350574baddd" },
    events: [],
    video_play_button: {
      type: "standard",
      url_image: "",
      template_animation: "multi_circle",
      _id: "624d4aa5c1fb4350574badde",
    },
  },
  language: { code: "it", _id: "5e441853b7500e8ec3abb3b3" },
  video: { flag: false, _id: "5e8ed72d77600e0f6b8ddf75" },
  voice: { flag: false, show_chat: false, _id: "5e441853b7500e8ec3abb3b4" },
  timer_close_chat: {
    flag: false,
    duration: 10,
    _id: "5e441853b7500e8ec3abb3b5",
  },
  avatar: {
    _id: "624d4aa5c1fb4350574badcb",
    background: {
      type: "media",
      image_url:
        "https://s3-eu-west-1.amazonaws.com/media-hej/Default/Web+Project/avatar_default.png",
      media_id: {
        _id: "65a69b6fae918632cdcfd10f",
        board: {
          name: "logo_new",
          univocal_code: "09Ihv9HrCeJxYFMCZkCJ",
          descr: "MediaCenter Yeah!",
          user_creator: "62725720520603807b75cf61",
          page_id: "5e42c36f5ab15198d5a247a1",
        },
        type: "image",
        format: "webp",
        media: {
          _id: "65a69b6fae91866523cfd110",
          original: {
            _id: "65a69b6fae9186e7becfd111",
            metadata: {
              width: 720,
              height: 720,
              size: 28040,
              bit_rate: 0,
              duration: 0,
              nb_frames: 0,
            },
            type: "original",
            ETag: "494de3bdc7b34bef334feaeb5af2d128",
            url: "https://s3-eu-west-1.amazonaws.com/media-hej/wind/image/logo_new-1705417583374.webp",
          },
          small: {
            _id: "65a69b6fae91860109cfd112",
            metadata: {
              width: 360,
              height: 360,
              size: 21150,
              bit_rate: 0,
              duration: 0,
              nb_frames: 0,
            },
            type: "small",
            ETag: "fd90f5237562b005d3b2a995b215bbed",
            url: "https://s3-eu-west-1.amazonaws.com/media-hej/wind/image/logo_new-1705417583374-small.webp",
          },
          tumblr: {
            _id: "65a69b6fae9186209ccfd113",
            metadata: {
              width: 150,
              height: 150,
              size: 5032,
              bit_rate: 0,
              duration: 0,
              nb_frames: 0,
            },
            type: "tumblr",
            ETag: "2578b65430cd72732f9a348e2252a229",
            url: "https://s3-eu-west-1.amazonaws.com/media-hej/wind/image/logo_new-1705417583374-tumblr.webp",
          },
          external_services: [],
        },
        metrics: [],
        created_at: "2024-01-16T15:06:23.808Z",
        updated_at: "2024-01-16T15:06:23.808Z",
        __v: 0,
      },
      _id: "624d6b86c1fb4350574cc1d8",
    },
  },
  banner: {
    type: "masthead",
    subtype: "standard",
    delivery_platform: "adform",
    custom_settings: {
      chat_overlay_background: { color: "#ffffff" },
      chat_margin_top: "0px",
      chat_max_height: "100%",
      fake_messages: [],
      fake_buttons: [],
      fake_chat_input_text: "Scrivi qualcosa...",
      fake_chat_bot_background_color: "#ffffff",
      fake_chat_bot_text_color: "#000000",
      fake_chat_bot_border_color: "#ffffff",
      fake_chat_bot_background_opacity: 1,
      fake_chat_input_background_color: "#ffffff",
      fake_chat_input_text_color: "#ffffff",
      fake_chat_input_background_opacity: 1,
      fake_chat_input_border_color: "#ffffff",
      topbar_custom: false,
      topbar_background:
        "https://media-hej.s3-eu-west-1.amazonaws.com/Default/Web+Project/topbar_custom_background.png",
      topbar_height: "50%",
      close_button_color: "#000000",
      input_position: "standard",
      chat_position: "top",
      chat_width: 50,
      preroll_bottom_image: "",
      click_out: true,
      preroll_background_color_header: "#ffffff",
      preroll_bottom_image_height: 0,
      _id: "5e441853b7500e8ec3abb3b6",
      topbar: { _id: "624d4aa5c1fb4350574bade7" },
      preroll: { _id: "624d4aa5c1fb4350574bade8" },
    },
  },
  size: { width: 970, height: 250 },
  background: {
    image_url: {
      desktop:
        "https://s3-eu-west-1.amazonaws.com/media-hej/Wind/image/1616455420639.jpeg",
      mobile:
        "https://s3-eu-west-1.amazonaws.com/media-hej/Wind/image/1616455401597.jpeg",
    },
    scroll: { flag: false, speed: 0.2 },
    hide_background: false,
    hide_background_color: "#ffffff",
    type: "gradient",
    color: ["#58595B", "#f5f5f5", "#f5f5f5", "#f5f5f5"],
    _id: "5e441853b7500e8ec3abb3b1",
  },
  media_id: { _id: "618265a43705696ec3ae6ffd" },
  topbar: {
    show: true,
    color: "#000000",
    background: "#000000",
    logo: "",
    border_bottom_color: "#000000",
    opacity: 1,
    button: { text: "", text_color: "", background: "" },
    title: { text: "", text_color: "#ffffff", background: "" },
    subtitle: { text: "", text_color: "#ffffff", background: "" },
    sharing: { show: false, channels: [] },
    image: {
      type: "media",
      image_url:
        "https://s3-eu-west-1.amazonaws.com/media-hej/Default/Web+Project/avatar_default.png",
      media_id: {
        _id: "65a69b91e2fd08314ebb50f4",
        board: {
          name: "topbar",
          univocal_code: "Z9wBwMAbtJZsbEznP8qX",
          descr: "MediaCenter Yeah!",
          user_creator: "62725720520603807b75cf61",
          page_id: "5e42c36f5ab15198d5a247a1",
        },
        type: "image",
        format: "webp",
        media: {
          _id: "65a69b91e2fd08151abb50f5",
          original: {
            _id: "65a69b91e2fd086b56bb50f6",
            metadata: {
              width: 720,
              height: 720,
              size: 28040,
              bit_rate: 0,
              duration: 0,
              nb_frames: 0,
            },
            type: "original",
            ETag: "494de3bdc7b34bef334feaeb5af2d128",
            url: "https://s3-eu-west-1.amazonaws.com/media-hej/wind/image/topbar-1705417616746.webp",
          },
          small: {
            _id: "65a69b91e2fd081003bb50f7",
            metadata: {
              width: 360,
              height: 360,
              size: 21150,
              bit_rate: 0,
              duration: 0,
              nb_frames: 0,
            },
            type: "small",
            ETag: "fd90f5237562b005d3b2a995b215bbed",
            url: "https://s3-eu-west-1.amazonaws.com/media-hej/wind/image/topbar-1705417616746-small.webp",
          },
          tumblr: {
            _id: "65a69b91e2fd087f91bb50f8",
            metadata: {
              width: 150,
              height: 150,
              size: 5032,
              bit_rate: 0,
              duration: 0,
              nb_frames: 0,
            },
            type: "tumblr",
            ETag: "2578b65430cd72732f9a348e2252a229",
            url: "https://s3-eu-west-1.amazonaws.com/media-hej/wind/image/topbar-1705417616746-tumblr.webp",
          },
          external_services: [],
        },
        metrics: [],
        created_at: "2024-01-16T15:06:57.204Z",
        updated_at: "2024-01-16T15:06:57.204Z",
        __v: 0,
      },
      _id: "624d4aa5c1fb4350574badec",
    },
  },
  brand: {
    text: "Offerta Mobile WindTre: la Migliore Offerta mobile per la tua attività",
    _id: "5e441853b7500e8ec3abb3b8",
  },
  analytics: {
    facebook_app_id: "",
    facebook_pixel_id: "864750684106459",
    google_tag_id: "",
    google_pixel_id: "",
    hotjar_site_id: "",
    tiktok_pixel_id: "",
    google_optimize_id: "",
    tracking_pixel: "",
    _id: "5e441853b7500e8ec3abb3b9",
  },
  track_utm: {
    media_center: "iprospect_dentsu",
    company: "telco",
    product: "B2B_Mobile",
    industry: "telco",
    brand: "WindTre Business",
    source: "facebook",
    product_category: "fisso",
    product_type: "fibra_b2b",
    product_name: "",
    product_id: "",
    partner: "iprospect_dentsu",
    medium: "",
    country: "",
  },
  custom_code: {
    css: ".chatbot__message__text {\nbox-shadow: 0 1px 10px 0 rgba(236, 106, 54, 0.8);\n}\n\n.chatbot__message__choice__cards__card ul li button {\n    color: #fff;\n    width: 100%;\n    text-align: center;\n    border: none;\n    background-color: #6535AB;\n    padding: 12px;\n}\n\n#hejchatbot_header{\nborder-bottom: 0px solid #FF6B00;\n}\n\n.chatbot__message__choice__buttons>button, .chatbot__message__choice__quicks>button {\n    border: 1px solid var(--user-border-color,#fff);\n}\n\n@media only screen and (max-width: 767px) {\n    button.button_large {\n      width: 100%\n    }\n }\n\n  @media only screen and (max-width: 767px) {\n    button.privacy_ok {\n      width: 100%\n    }\n }\n footer{ display:flex; flex-direction:column; \n   background:#58595B;\n    color: #fffff;\npadding:5px;\n}\n#hejchatbot_header_logo {\n    min-width: 100px;\n    max-width: 100px;\n    min-height: 50px;\n    max-height: 50px;\n    background-image: var(--logo-image, none);\n    background-size: contain;\n    background-position: center center;\n    background-repeat: no-repeat;\n}",
    js: "",
  },
  footer: {
    show: false,
    show_cookie_policy: true,
    cookie_policy_text_color: "#ffffff",
    cookie_policy_background_color: "#58595B",
    text: '<span style="color: #ffffff;font-size: 10px;line-height: 12px;letter-spacing: -0.2px;">*dal terzo mese il prezzo Fibra sarà 28,99 €<span style="display:block;">\n<a     style="color: #ffffff;text-decoration: underline;font-size: 10px;" href="#" class="iubenda-cs-preferences-link"><strong>Cookie Policy-Personalizza tracciamento</strong></a>',
    text_color: "",
    background: "",
    remove_first_interaction: false,
    info_company: false,
    cookie_policy_client: "",
    image: {
      type: "image",
      image_url:
        "https://s3-eu-west-1.amazonaws.com/media-hej/Default/Web+Project/avatar_default.png",
      media_id: null,
      _id: "624d4aa5c1fb4350574badef",
    },
  },
  menu: { show: false, items: [] },
  progress_bar: {
    flag: false,
    text_color: "#43d3d4",
    bar_empty_color: "#dfe3eb",
    bar_fill_color: "#43d3d4",
    circle_fill_color: "#43d3d4",
    circle_empty_color: "#dfe3eb",
    circle_active_color: "#43d3d4",
    circle_passed_type: "fill",
    circle_passed_color: "#43d3d4",
    circle_passed_icon_color: "#ffffff",
    _id: "62a986e7a2dac167b8a549ee",
    steps: [],
  },
  name: "",
  ws_url: "https://www.hejagency.com/banner-bot/5678/banner/webhook",
  ws_app_id: "821819111359586",
  ws_page_id: "106285491895255",
  welcome_message: "659d719931e30a4f3cb3b282",
  staging_mode: false,
  univocal_code_bot: "wind",
  group_bot: "WIND",
  bot_id: "5e42c36f5ab15198d5a247a3",
  web_project_id: "65a11ee031e30a6c9eb9ca0e",
  page_id: "5e42c36f5ab15198d5a247a1",
  publicVapidKey:
    "BKkC8r9dvBkuPzTESn_KeIz8gTFg2AST9RfSrMsZUr0SM9fLqpVMsfz6pVY6nVD3_qaUmrAOfrd1x1bXRJ1-3OA",
};
var web_project_id = "65a11ee031e30a6c9eb9ca0e";
var optimization_test = {};
var hej_preno_id = "65a1200e940846032345c2d5";
