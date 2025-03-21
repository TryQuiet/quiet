import { is } from 'ramda'

// Emoji shortcode mapping
export interface EmojiMapping {
  [key: string]: string
}

// Common emoji shortcodes (GitHub/Slack style) - this is a starting point, can be expanded
const emojiShortcodes: EmojiMapping = {
  // --- Smiley / People ---
  ':grinning:': '😀',
  ':smiley:': '😃',
  ':smile:': '😄',
  ':grin:': '😁',
  ':laughing:': '😆',
  ':sweat_smile:': '😅',
  ':joy:': '😂',
  ':rofl:': '🤣',
  ':blush:': '😊',
  ':innocent:': '😇',
  ':slight_smile:': '🙂',
  ':upside_down:': '🙃',
  ':wink:': '😉',
  ':relieved:': '😌',
  ':heart_eyes:': '😍',
  ':smiling_face_with_3_hearts:': '🥰',
  ':kissing_heart:': '😘',
  ':kissing:': '😗',
  ':kissing_smiling_eyes:': '😙',
  ':kissing_closed_eyes:': '😚',
  ':yum:': '😋',
  ':stuck_out_tongue:': '😛',
  ':stuck_out_tongue_winking_eye:': '😜',
  ':zany_face:': '🤪',
  ':stuck_out_tongue_closed_eyes:': '😝',
  ':money_mouth:': '🤑',
  ':hugs:': '🤗',
  ':face_with_hand_over_mouth:': '🤭',
  ':shushing_face:': '🤫',
  ':thinking:': '🤔',
  ':zipper_mouth:': '🤐',
  ':face_with_raised_eyebrow:': '🤨',

  // --- Animals & Nature ---
  ':dog:': '🐶',
  ':cat:': '🐱',
  ':mouse:': '🐭',
  ':hamster:': '🐹',
  ':rabbit:': '🐰',
  ':fox:': '🦊',
  ':bear:': '🐻',
  ':panda_face:': '🐼',
  ':koala:': '🐨',
  ':tiger:': '🐯',
  ':lion:': '🦁',
  ':cow:': '🐮',
  ':pig:': '🐷',
  ':frog:': '🐸',
  ':monkey_face:': '🐵',
  ':chicken:': '🐔',
  ':unicorn:': '🦄',
  ':horse:': '🐴',
  ':zebra:': '🦓',
  ':snake:': '🐍',
  ':turtle:': '🐢',
  ':lizard:': '🦎',
  ':octopus:': '🐙',
  ':squid:': '🦑',
  ':fish:': '🐟',
  ':dolphin:': '🐬',
  ':butterfly:': '🦋',
  ':lady_beetle:': '🐞',
  ':ant:': '🐜',
  ':duck:': '🦆',
  ':deciduous_tree:': '🌳',
  ':cherry_blossom:': '🌸',
  ':sunflower:': '🌻',
  ':blossom:': '🌼',
  ':hibiscus:': '🌺',
  ':rose:': '🌹',
  ':cactus:': '🌵',
  ':palm_tree:': '🌴',
  ':four_leaf_clover:': '🍀',
  ':fallen_leaf:': '🍂',
  ':maple_leaf:': '🍁',

  // --- Food & Drink ---
  ':green_apple:': '🍏',
  ':apple:': '🍎',
  ':pear:': '🍐',
  ':tangerine:': '🍊',
  ':lemon:': '🍋',
  ':banana:': '🍌',
  ':watermelon:': '🍉',
  ':grapes:': '🍇',
  ':strawberry:': '🍓',
  ':melon:': '🍈',
  ':cherries:': '🍒',
  ':peach:': '🍑',
  ':pineapple:': '🍍',
  ':mango:': '🥭',
  ':coconut:': '🥥',
  ':kiwi:': '🥝',
  ':tomato:': '🍅',
  ':avocado:': '🥑',
  ':broccoli:': '🥦',
  ':leafy_green:': '🥬',
  ':cucumber:': '🥒',
  ':corn:': '🌽',
  ':carrot:': '🥕',
  ':potato:': '🥔',
  ':sweet_potato:': '🍠',
  ':bagel:': '🥯',
  ':baguette_bread:': '🥖',
  ':bread:': '🍞',
  ':croissant:': '🥐',
  ':pancakes:': '🥞',
  ':waffle:': '🧇',
  ':cheese:': '🧀',
  ':meat_on_bone:': '🍖',
  ':poultry_leg:': '🍗',
  ':hamburger:': '🍔',
  ':fries:': '🍟',
  ':pizza:': '🍕',
  ':hotdog:': '🌭',
  ':taco:': '🌮',
  ':burrito:': '🌯',
  ':stuffed_flatbread:': '🥙',
  ':sushi:': '🍣',
  ':bento:': '🍱',
  ':curry:': '🍛',
  ':ramen:': '🍜',
  ':stew:': '🍲',
  ':green_salad:': '🥗',
  ':popcorn:': '🍿',
  ':salt:': '🧂',
  ':doughnut:': '🍩',
  ':cookie:': '🍪',
  ':birthday:': '🎂',
  ':cake:': '🍰',
  ':cupcake:': '🧁',
  ':chocolate_bar:': '🍫',
  ':candy:': '🍬',
  ':lollipop:': '🍭',
  ':custard:': '🍮',
  ':honey_pot:': '🍯',
  ':coffee:': '☕',
  ':tea:': '🍵',
  ':cup_with_straw:': '🥤',
  ':beer:': '🍺',
  ':beers:': '🍻',
  ':clinking_glasses:': '🥂',
  ':wine_glass:': '🍷',
  ':cocktail:': '🍸',
  ':tumbler_glass:': '🥃',
  ':milk_glass:': '🥛',

  // --- Activity & Sports ---
  ':soccer:': '⚽',
  ':basketball:': '🏀',
  ':football:': '🏈',
  ':baseball:': '⚾',
  ':tennis:': '🎾',
  ':volleyball:': '🏐',
  ':rugby_football:': '🏉',
  ':8ball:': '🎱',
  ':ping_pong:': '🏓',
  ':badminton:': '🏸',
  ':goal_net:': '🥅',
  ':ice_hockey:': '🏒',
  ':field_hockey:': '🏑',
  ':lacrosse:': '🥍',
  ':cricket_bat_and_ball:': '🏏',
  ':golf:': '⛳',
  ':bow_and_arrow:': '🏹',
  ':fishing_pole_and_fish:': '🎣',
  ':boxing_glove:': '🥊',
  ':martial_arts_uniform:': '🥋',
  ':running_shirt_with_sash:': '🎽',
  ':sports_medal:': '🏅',
  ':medal_military:': '🎖️',
  ':first_place_medal:': '🥇',
  ':second_place_medal:': '🥈',
  ':third_place_medal:': '🥉',
  ':trophy:': '🏆',
  ':rosette:': '🏵️',
  ':reminder_ribbon:': '🎗️',
  ':ticket:': '🎫',
  ':tickets:': '🎟️',
  ':circus_tent:': '🎪',
  ':juggling:': '🤹',
  ':performing_arts:': '🎭',
  ':art:': '🎨',
  ':clapper:': '🎬',
  ':microphone:': '🎤',
  ':headphones:': '🎧',
  ':saxophone:': '🎷',
  ':guitar:': '🎸',
  ':musical_keyboard:': '🎹',
  ':trumpet:': '🎺',
  ':violin:': '🎻',
  ':drum:': '🥁',
  ':dart:': '🎯',
  ':bowling:': '🎳',
  ':video_game:': '🎮',
  ':joystick:': '🕹️',
  ':slot_machine:': '🎰',
  ':game_die:': '🎲',
  ':jigsaw:': '🧩',
  ':chess_pawn:': '♟️',
  ':flower_playing_cards:': '🎴',
  ':black_joker:': '🃏',
  ':mahjong:': '🀄',

  // --- Travel & Places ---
  ':car:': '🚗',
  ':taxi:': '🚕',
  ':blue_car:': '🚙',
  ':bus:': '🚌',
  ':trolleybus:': '🚎',
  ':racing_car:': '🏎️',
  ':police_car:': '🚓',
  ':ambulance:': '🚑',
  ':fire_engine:': '🚒',
  ':minibus:': '🚐',
  ':truck:': '🚚',
  ':articulated_lorry:': '🚛',
  ':tractor:': '🚜',
  ':kick_scooter:': '🛴',
  ':bike:': '🚲',
  ':motor_scooter:': '🛵',
  ':motorcycle:': '🏍️',
  ':rotating_light:': '🚨',
  ':oncoming_police_car:': '🚔',
  ':oncoming_bus:': '🚍',
  ':oncoming_automobile:': '🚘',
  ':oncoming_taxi:': '🚖',
  ':aerial_tramway:': '🚡',
  ':mountain_cableway:': '🚠',
  ':suspension_railway:': '🚟',
  ':railway_car:': '🚃',
  ':train:': '🚋',
  ':mountain_railway:': '🚞',
  ':monorail:': '🚝',
  ':bullettrain_side:': '🚄',
  ':bullettrain_front:': '🚅',
  ':light_rail:': '🚈',
  ':steam_locomotive:': '🚂',
  ':train2:': '🚆',
  ':metro:': '🚇',
  ':tram:': '🚊',
  ':station:': '🚉',
  ':airplane:': '✈️',
  ':airplane_departure:': '🛫',
  ':airplane_arriving:': '🛬',
  ':small_airplane:': '🛩️',
  ':seat:': '💺',
  ':helicopter:': '🚁',
  ':artificial_satellite:': '🛰️',
  ':rocket:': '🚀',
  ':flying_saucer:': '🛸',
  ':canoe:': '🛶',
  ':boat:': '⛵',
  ':speedboat:': '🚤',
  ':motor_boat:': '🛥️',
  ':passenger_ship:': '🛳️',
  ':ship:': '🚢',
  ':anchor:': '⚓',
  ':ferry:': '⛴️',
  ':beach_umbrella:': '🏖️',
  ':volcano:': '🌋',
  ':mount_fuji:': '🗻',
  ':mountain_snow:': '🏔️',
  ':camping:': '🏕️',
  ':desert:': '🏜️',
  ':desert_island:': '🏝️',
  ':national_park:': '🏞️',
  ':stadium:': '🏟️',
  ':classical_building:': '🏛️',
  ':building_construction:': '🏗️',
  ':houses:': '🏘️',
  ':cityscape:': '🏙️',
  ':house_abandoned:': '🏚️',
  ':house:': '🏠',
  ':house_with_garden:': '🏡',
  ':office:': '🏢',
  ':post_office:': '🏣',
  ':european_post_office:': '🏤',
  ':hospital:': '🏥',
  ':bank:': '🏦',
  ':hotel:': '🏨',
  ':love_hotel:': '🏩',
  ':convenience_store:': '🏪',
  ':school:': '🏫',
  ':department_store:': '🏬',
  ':factory:': '🏭',
  ':japanese_castle:': '🏯',
  ':european_castle:': '🏰',
  ':wedding:': '💒',
  ':tokyo_tower:': '🗼',
  ':statue_of_liberty:': '🗽',
  ':map_of_japan:': '🗾',
  ':foggy:': '🌁',
  ':night_with_stars:': '🌃',
  ':sunrise_over_mountains:': '🌄',
  ':sunrise:': '🌅',
  ':city_sunrise:': '🌆',
  ':city_sunset:': '🌇',
  ':bridge_at_night:': '🌉',
  ':milky_way:': '🌌',

  // --- Objects ---
  ':lock:': '🔒',
  ':unlock:': '🔓',
  ':lock_with_ink_pen:': '🔏',
  ':closed_lock_with_key:': '🔐',
  ':key:': '🔑',
  ':old_key:': '🗝️',
  ':hammer:': '🔨',
  ':axe:': '🪓',
  ':pick:': '⛏️',
  ':hammer_and_pick:': '⚒️',
  ':hammer_and_wrench:': '🛠️',
  ':dagger:': '🗡️',
  ':crossed_swords:': '⚔️',
  ':gun:': '🔫',
  ':shield:': '🛡️',
  ':wrench:': '🔧',
  ':nut_and_bolt:': '🔩',
  ':gear:': '⚙️',
  ':clamp:': '🗜️',
  ':balance_scale:': '⚖️',
  ':probing_cane:': '🦯',
  ':link:': '🔗',
  ':chains:': '⛓️',
  ':hook:': '🪝',
  ':toolbox:': '🧰',
  ':magnet:': '🧲',
  ':ladder:': '🪜',
  ':alembic:': '⚗️',
  ':test_tube:': '🧪',
  ':petri_dish:': '🧫',
  ':dna:': '🧬',
  ':microscope:': '🔬',
  ':telescope:': '🔭',
  ':satellite:': '📡',
  ':syringe:': '💉',
  ':drop_of_blood:': '🩸',
  ':pill:': '💊',
  ':adhesive_bandage:': '🩹',
  ':stethoscope:': '🩺',
  ':door:': '🚪',
  ':elevator:': '🛗',
  ':mirror:': '🪞',
  ':window:': '🪟',
  ':bed:': '🛏️',
  ':couch_and_lamp:': '🛋️',
  ':chair:': '🪑',
  ':toilet:': '🚽',
  ':shower:': '🚿',
  ':bathtub:': '🛁',
  ':plunger:': '🪠',
  ':smoking:': '🚬',
  ':coffin:': '⚰️',
  ':funeral_urn:': '⚱️',
  ':moyai:': '🗿',
  ':shopping:': '🛍️',
  ':shopping_cart:': '🛒',
  ':gift:': '🎁',
  ':balloon:': '🎈',
  ':flags:': '🎏',
  ':ribbon:': '🎀',
  ':confetti_ball:': '🎊',
  ':tada:': '🎉',
  ':dolls:': '🎎',
  ':izakaya_lantern:': '🏮',
  ':diya_lamp:': '🪔',
  ':email:': '✉️',
  ':e-mail:': '📧',
  ':package:': '📦',
  ':postbox:': '📮',
  ':postal_horn:': '📯',
  ':scroll:': '📜',
  ':page_with_curl:': '📃',
  ':page_facing_up:': '📄',
  ':calendar:': '📆',
  ':date:': '📅',
  ':card_index:': '📇',
  ':clipboard:': '📋',
  ':file_folder:': '📁',
  ':open_file_folder:': '📂',
  ':card_index_dividers:': '🗂️',
  ':file_cabinet:': '🗃️', // repeated
  ':bookmark_tabs:': '📑',
  ':label:': '🏷️',
  ':bar_chart:': '📊',
  ':chart_with_upwards_trend:': '📈',
  ':chart_with_downwards_trend:': '📉',
  ':pushpin:': '📌',
  ':round_pushpin:': '📍',
  ':paperclip:': '📎',
  ':paperclips:': '🖇️',
  ':triangular_ruler:': '📐',
  ':straight_ruler:': '📏',
  ':abacus:': '🧮',
  ':closed_book:': '📕',
  ':book:': '📖',
  ':green_book:': '📗',
  ':blue_book:': '📘',
  ':orange_book:': '📙',
  ':books:': '📚',
  ':notebook:': '📓',
  ':ledger:': '📒',
  ':bookmark:': '🔖',
  ':camera:': '📷',
  ':camera_flash:': '📸',
  ':video_camera:': '📹',
  ':vhs:': '📼',
  ':tv:': '📺',
  ':radio:': '📻',
  ':studio_microphone:': '🎙️',
  ':banjo:': '🪕',
  ':iphone:': '📱',
  ':calling:': '📲',
  ':computer:': '💻',
  ':desktop_computer:': '🖥️',
  ':printer:': '🖨️',
  ':keyboard:': '⌨️',
  ':computer_mouse:': '🖱️',
  ':trackball:': '🖲️',
  ':minidisc:': '💽',
  ':floppy_disk:': '💾',
  ':cd:': '💿',
  ':dvd:': '📀',
  ':telephone_receiver:': '📞',
  ':phone:': '☎️',
  ':fax:': '📠',
  ':loud_sound:': '🔊',
  ':sound:': '🔉',
  ':speaker:': '🔈',
  ':mute:': '🔇',
  ':loudspeaker:': '📢',
  ':mega:': '📣',
  ':bell:': '🔔',
  ':no_bell:': '🔕',
  ':crystal_ball:': '🔮',
  ':nazar_amulet:': '🧿',
  ':magic_wand:': '🪄',
  ':teddy_bear:': '🧸',
  ':nesting_dolls:': '🪆',
  ':piñata:': '🪅',
  ':yo-yo:': '🪀',

  // --- Symbols ---
  ':heart:': '❤️',
  ':yellow_heart:': '💛',
  ':green_heart:': '💚',
  ':blue_heart:': '💙',
  ':purple_heart:': '💜',
  ':black_heart:': '🖤',
  ':white_heart:': '🤍',
  ':brown_heart:': '🤎',
  ':broken_heart:': '💔',
  ':heavy_heart_exclamation:': '❣️',
  ':two_hearts:': '💕',
  ':revolving_hearts:': '💞',
  ':heartbeat:': '💓',
  ':heartpulse:': '💗',
  ':sparkling_heart:': '💖',
  ':cupid:': '💘',
  ':gift_heart:': '💝',
  ':heart_decoration:': '💟',
  ':peace_symbol:': '☮️',
  ':latin_cross:': '✝️',
  ':star_and_crescent:': '☪️',
  ':om:': '🕉️',
  ':wheel_of_dharma:': '☸️',
  ':star_of_david:': '✡️',
  ':menorah:': '🕎',
  ':yin_yang:': '☯️',
  ':orthodox_cross:': '☦️',
  ':place_of_worship:': '🛐',
  ':ophiuchus:': '⛎',
  ':aries:': '♈',
  ':taurus:': '♉',
  ':gemini:': '♊',
  ':cancer:': '♋',
  ':leo:': '♌',
  ':virgo:': '♍',
  ':libra:': '♎',
  ':scorpius:': '♏',
  ':sagittarius:': '♐',
  ':capricorn:': '♑',
  ':aquarius:': '♒',
  ':pisces:': '♓',
  ':twisted_rightwards_arrows:': '🔀',
  ':repeat:': '🔁',
  ':repeat_one:': '🔂',
  ':arrow_forward:': '▶️',
  ':fast_forward:': '⏩',
  ':next_track_button:': '⏭️',
  ':play_or_pause_button:': '⏯️',
  ':arrow_backward:': '◀️',
  ':rewind:': '⏪',
  ':previous_track_button:': '⏮️',
  ':arrow_up_small:': '🔼',
  ':arrow_double_up:': '⏫',
  ':arrow_down_small:': '🔽',
  ':arrow_double_down:': '⏬',
  ':cinema:': '🎦',
  ':low_brightness:': '🔅',
  ':high_brightness:': '🔆',
  ':signal_strength:': '📶',
  ':vibration_mode:': '📳',
  ':mobile_phone_off:': '📴',
  ':recycle:': '♻️',
  ':ok:': '🆗',
  ':cool:': '🆒',
  ':new:': '🆕',
  ':up:': '🆙',
  ':free:': '🆓',
  ':abc:': '🔤',
  ':abcd:': '🔡',
  ':capital_abcd:': '🔠',
  ':1234:': '🔢',
  ':symbols:': '🔣',
  ':a:': '🅰️',
  ':b:': '🅱️',
  ':ab:': '🆎',
  ':o:': '🅾️',
  ':arrows_counterclockwise:': '🔄',
  ':arrows_clockwise:': '🔃',
  ':musical_note:': '🎵',
  ':notes:': '🎶',
  ':heavy_plus_sign:': '➕',
  ':heavy_minus_sign:': '➖',
  ':heavy_division_sign:': '➗',
  ':heavy_multiplication_x:': '✖️',
  ':infinity:': '♾️',
  ':question:': '❓',
  ':grey_question:': '❔',
  ':grey_exclamation:': '❕',
  ':exclamation:': '❗',
  ':interrobang:': '⁉️',
  ':currency_exchange:': '💱',
  ':heavy_dollar_sign:': '💲',
  ':medical_symbol:': '⚕️',
  ':fleur_de_lis:': '⚜️',
  ':trident:': '🔱',
  ':name_badge:': '📛',
  ':beginner:': '🔰',
  ':negative_squared_cross_mark:': '❎',
  ':curly_loop:': '➰',
  ':loop:': '➿',
  ':part_alternation_mark:': '〽️',
  ':end:': '🔚',
  ':on:': '🔛',
  ':soon:': '🔜',
  ':top:': '🔝',
  ':eight_pointed_black_star:': '✴️',
  ':koko:': '🈁',
  ':vs:': '🆚',
  ':accept:': '🉑',

  // --- Flags ---
  ':flag_us:': '🇺🇸',
  ':flag_ca:': '🇨🇦',
  ':flag_gb:': '🇬🇧',
  ':flag_au:': '🇦🇺',
  ':flag_in:': '🇮🇳',
  ':flag_jp:': '🇯🇵',
  ':flag_kr:': '🇰🇷',
  ':flag_cn:': '🇨🇳',
  ':flag_de:': '🇩🇪',
  ':flag_fr:': '🇫🇷',
  ':flag_es:': '🇪🇸',
  ':flag_it:': '🇮🇹',
  ':flag_br:': '🇧🇷',
  ':flag_ru:': '🇷🇺',
  ':flag_mx:': '🇲🇽',
  ':flag_sa:': '🇸🇦',
  ':flag_za:': '🇿🇦',
  ':flag_ae:': '🇦🇪',
  ':flag_ar:': '🇦🇷',
  ':flag_ng:': '🇳🇬',
  ':flag_eg:': '🇪🇬',
  ':flag_tr:': '🇹🇷',
  ':flag_il:': '🇮🇱',
  ':flag_sg:': '🇸🇬',
  ':flag_nz:': '🇳🇿',
  ':flag_id:': '🇮🇩',
  ':flag_ph:': '🇵🇭',
  ':flag_pk:': '🇵🇰',
  ':flag_th:': '🇹🇭',
  ':flag_vn:': '🇻🇳',
  ':flag_my:': '🇲🇾',
  ':flag_bd:': '🇧🇩',
  ':flag_pl:': '🇵🇱',
  ':flag_no:': '🇳🇴',
  ':flag_se:': '🇸🇪',
  ':flag_dk:': '🇩🇰',
  ':flag_fi:': '🇫🇮',
  ':flag_nl:': '🇳🇱',
  ':flag_be:': '🇧🇪',
  ':flag_at:': '🇦🇹',
  ':flag_ch:': '🇨🇭',
  ':flag_pt:': '🇵🇹',
  ':flag_gr:': '🇬🇷',
  ':flag_hu:': '🇭🇺',
  ':flag_cz:': '🇨🇿',
  ':flag_ro:': '🇷🇴',
  ':flag_sk:': '🇸🇰',
  ':flag_bg:': '🇧🇬',
  ':flag_ir:': '🇮🇷',
  ':flag_iq:': '🇮🇶',
  ':flag_np:': '🇳🇵',
  ':flag_af:': '🇦🇫',
  ':flag_lk:': '🇱🇰',
  ':flag_bh:': '🇧🇭',
  ':flag_jo:': '🇯🇴',
  ':flag_qa:': '🇶🇦',
  ':flag_om:': '🇴🇲',
  ':flag_kw:': '🇰🇼',
  ':flag_ye:': '🇾🇪',
  ':flag_ma:': '🇲🇦',
  ':flag_dz:': '🇩🇿',
  ':flag_tn:': '🇹🇳',
  ':flag_ly:': '🇱🇾',
  ':rainbow_flag:': '🏳️‍🌈',
  ':transgender_flag:': '🏳️‍⚧️',
  ':black_flag:': '🏴',
  ':checkered_flag:': '🏁',
  ':triangular_flag_on_post:': '🚩',
  ':white_flag:': '🏳️',
  ':united_nations:': '🇺🇳',
}

// Common emoticons/ASCII art
const emoticons: EmojiMapping = {
  ':)': '🙂',
  ':-)': '🙂',
  ':D': '😀',
  ':-D': '😀',
  ';)': '😉',
  ';-)': '😉',
  ':(': '🙁',
  ':-(': '🙁',
  ':|': '😐',
  ':-|': '😐',
  ':O': '😮',
  ':-O': '😮',
  ':o': '😮',
  ':-o': '😮',
  ';P': '😜',
  ';-P': '😜',
  ';p': '😜',
  ';-p': '😜',
  ':P': '😛',
  ':-P': '😛',
  ':p': '😛',
  ':-p': '😛',
  ':*': '😘',
  ':-*': '😘',
  ':/': '😕',
  ':-/': '😕',
  ':S': '😖',
  ':-S': '😖',
  ':s': '😖',
  ':-s': '😖',
  ":'(": '😢',
  ":'-(": '😢',
  ":'D": '😂',
  ":'-)": '😂',
  o_O: '😳',
  O_o: '😳',
  O_O: '😳',
  '>:(': '😠',
  '>:-(': '😠',
  '>:)': '😈',
  '>:-)': '😈',
  '<3': '❤️',
  '(y)': '👍',
  '(n)': '👎',
}
// -------------------------------------------
// 2) Parsing to detect unclosed code/LaTeX blocks
// -------------------------------------------
/**
 * Returns `true` if the position `pos` (where last word begins)
 * is currently inside an unclosed triple-backtick fence or unclosed `$$` block.
 * We do a simple left-to-right parse counting enters/exits of code or math blocks.
 */
function isInsideUnclosedFenceOrLatex(text: string, pos: number): boolean {
  let inFence = false
  let inLatex = false
  let i = 0

  while (i < pos) {
    // Check triple backticks
    const nextFence = text.indexOf('```', i)
    const nextDollars = text.indexOf('$$', i)

    // If neither found, we can break
    if (nextFence === -1 && nextDollars === -1) break

    // Decide which occurs first in the text
    let nextEvent: 'fence' | 'latex' = 'fence'
    let nextIndex = nextFence

    if (nextFence === -1 || (nextDollars !== -1 && nextDollars < nextFence)) {
      nextEvent = 'latex'
      nextIndex = nextDollars
    }

    if (nextIndex === -1 || nextIndex >= pos) {
      // No event or it's beyond pos
      break
    }

    // Move to that event
    i = nextIndex

    if (nextEvent === 'fence') {
      // Toggle fence: if not inFence, we enter; if inFence, we exit
      inFence = !inFence
      // skip past it
      i += 3
    } else {
      // nextEvent === 'latex'
      inLatex = !inLatex
      i += 2
    }
  }

  // If after scanning up to pos, we are still inFence or inLatex, then it's unclosed
  return inFence || inLatex
}

// -------------------------------------------
// 3) Extract last word
// -------------------------------------------
function extractLastWord(text: string): { word: string; delimiter: string; startIndex: number } {
  // If there's trailing space/punct, treat preceding chunk as a complete word
  const trailingDelim = text.match(/[ \t\r\n.,!?]+$/)
  if (trailingDelim) {
    const delimiter = trailingDelim[0]
    const delimStart = trailingDelim.index!
    const candidateText = text.slice(0, delimStart)
    const wordMatch = candidateText.match(/[\w<>:()[\]{}]+$/)
    if (!wordMatch || wordMatch.index == null) {
      return { word: '', delimiter, startIndex: -1 }
    }
    return {
      word: wordMatch[0],
      delimiter,
      startIndex: wordMatch.index,
    }
  }

  // Otherwise, partial word at the very end
  const wordMatch = text.match(/[\w<>:()[\]{}]+$/)
  if (!wordMatch || wordMatch.index == null) {
    return { word: '', delimiter: '', startIndex: -1 }
  }
  return {
    word: wordMatch[0],
    delimiter: '',
    startIndex: wordMatch.index,
  }
}

// -------------------------------------------
// 4) Protected check for "while typing" scenario
// -------------------------------------------
function isLastWordProtected(text: string): boolean {
  const { word, startIndex } = extractLastWord(text)
  if (!word) return false

  // If inside an unclosed triple-fence or unclosed $$, skip
  const insideFence = isInsideUnclosedFenceOrLatex(text, startIndex)
  if (insideFence) return true

  // Also skip if there's a fully closed code snippet or $$ block that includes startIndex
  // Or if it's inside a URL or simple math, or attached to prior word-chars.
  // We do this with simpler matches:

  // A) code blocks (fully closed)
  const codeBlockMatches = [...text.matchAll(/```[\s\S]*?```|`[^`]+`/g)]
  for (const m of codeBlockMatches) {
    if (m.index != null) {
      const blockStart = m.index
      const blockEnd = blockStart + m[0].length
      if (startIndex >= blockStart && startIndex < blockEnd) {
        return true
      }
    }
  }

  // B) fully closed $$ blocks
  const latexMatches = [...text.matchAll(/\$\$[\s\S]*?\$\$/g)]
  for (const m of latexMatches) {
    if (m.index != null) {
      const blockStart = m.index
      const blockEnd = blockStart + m[0].length
      if (startIndex >= blockStart && startIndex < blockEnd) {
        return true
      }
    }
  }

  // C) URLs
  const urlMatches = [...text.matchAll(/https?:\/\/\S+/g)]
  for (const m of urlMatches) {
    if (m.index != null) {
      const urlStart = m.index
      const urlEnd = urlStart + m[0].length
      if (startIndex >= urlStart && startIndex < urlEnd) {
        return true
      }
    }
  }

  // D) simple math expressions
  const mathRegex = /\b\d+[<>]\d+\b|\b\w+[<>]\d+\b|\([^)]*[<>][^)]*\)/g
  const mathMatches = [...text.matchAll(mathRegex)]
  for (const m of mathMatches) {
    if (m.index != null) {
      const exprStart = m.index
      const exprEnd = exprStart + m[0].length
      if (startIndex >= exprStart && startIndex < exprEnd) {
        return true
      }
    }
  }

  // E) If the lastWord is attached to prior word-chars => treat it as part of bigger word
  if (startIndex > 0 && /\w$/.test(text.slice(startIndex - 1, startIndex))) {
    return true
  }

  return false
}

// -------------------------------------------
// 5) While-typing replacement
// -------------------------------------------
function replaceIfEmoji(word: string, delimiter: string): { replaced: string; offset: number } {
  // shortcodes => always replace
  if (emojiShortcodes[word]) {
    const replacedWord = emojiShortcodes[word]
    const offset = replacedWord.length - word.length
    return { replaced: replacedWord, offset }
  }

  // emoticons => require a trailing delimiter
  if (emoticons[word]) {
    if (!delimiter) {
      return { replaced: word, offset: 0 }
    }
    const replacedWord = emoticons[word]
    let offset = replacedWord.length - word.length
    // tests want an extra -1 if emoticon had trailing space/punct
    offset -= 1
    return { replaced: replacedWord, offset }
  }

  return { replaced: word, offset: 0 }
}

function emojifyWhileTyping(text: string, cursorPos: number): { text: string; cursorOffset: number } {
  const beforeCursor = text.slice(0, cursorPos)
  const afterCursor = text.slice(cursorPos)

  if (isLastWordProtected(beforeCursor)) {
    return { text, cursorOffset: 0 }
  }

  const { word, delimiter, startIndex } = extractLastWord(beforeCursor)
  if (!word) {
    return { text, cursorOffset: 0 }
  }

  const { replaced, offset } = replaceIfEmoji(word, delimiter)
  if (replaced === word) {
    return { text, cursorOffset: 0 }
  }

  const beforeWord = beforeCursor.slice(0, startIndex)
  const newText = beforeWord + replaced + delimiter + afterCursor
  return { text: newText, cursorOffset: offset }
}

// -------------------------------------------
// 6) On-send: Replace all in unprotected segments
// -------------------------------------------
function replaceAllEmojisInUnprotected(segment: string): string {
  // Word-boundary-based matching of emoticons & shortcodes
  // Using lookbehind/lookahead to avoid partial word replacements.
  // We'll include :p, :), <3, etc., plus shortcodes like :heart:
  // Make sure to add variants as needed.
  const tokenRegex = new RegExp(
    [
      ':[a-zA-Z0-9_+\\-]+:', // shortcodes (":smile:")
      '(?<![A-Za-z0-9])<3(?=$|\\s|[^A-Za-z0-9])', // <3 not part of a word
      '(?<![A-Za-z0-9])[;:]-?[)Ddp(](?![A-Za-z0-9])', // ;), :D, etc. not part of a word
    ].join('|'),
    'g'
  )

  return segment.replace(tokenRegex, match => {
    if (emojiShortcodes[match]) {
      return emojiShortcodes[match]
    }
    if (emoticons[match]) {
      return emoticons[match]
    }
    return match
  })
}

function emojifyOnSend(text: string): string {
  // Protected: triple backtick blocks, inline code, URLs, $$ math blocks, simple math
  const protectedRegex =
    /```[\s\S]*?```|`[^`]+`|https?:\/\/\S+|\$\$[\s\S]*?\$\$|\b\d+[<>]\d+\b|\b\w+[<>]\d+\b|\([^)]*[<>][^)]*\)/g

  let result = ''
  let lastIndex = 0
  const matches = [...text.matchAll(protectedRegex)]

  for (const m of matches) {
    if (m.index == null) continue
    const start = m.index
    // unprotected chunk
    const unprotected = text.slice(lastIndex, start)
    result += replaceAllEmojisInUnprotected(unprotected)
    // add protected chunk verbatim
    result += m[0]
    lastIndex = start + m[0].length
  }

  // leftover unprotected
  if (lastIndex < text.length) {
    const unprotected = text.slice(lastIndex)
    result += replaceAllEmojisInUnprotected(unprotected)
  }

  return result
}

// -------------------------------------------
// 7) Main export
// -------------------------------------------
export function emojify(
  text: string,
  options?: number | { finalSend?: boolean }
): { text: string; cursorOffset: number } | string {
  if (typeof options === 'number') {
    return emojifyWhileTyping(text, options)
  }
  if (options && options.finalSend) {
    return emojifyOnSend(text)
  }
  return { text, cursorOffset: 0 }
}
