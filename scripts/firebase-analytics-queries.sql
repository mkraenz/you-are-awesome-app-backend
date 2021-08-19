-- note: screen name `MainActivity` is `Home`. MainActivity is shown whenever a new session starts. It's a Firebase Analytics.

-- simple user journey
SELECT TIMESTAMP_MICROS(event_timestamp) as timestamp, event_name, user_pseudo_id
FROM `youareawesomeapp-c8835.analytics_213876904.*`
ORDER BY user_pseudo_id, event_timestamp
LIMIT 100

-- average sessions per user
-- See Firebase Analytics Dashboard

-- navigation paths
SELECT event_timestamp, user_pseudo_id as user, params.value.string_value as screen from 
(
    -- user journey
    SELECT event_timestamp, event_params, event_name, user_pseudo_id
    FROM `youareawesomeapp-c8835.analytics_213876904.*`
    WHERE event_name = 'screen_view'
    ORDER BY user_pseudo_id, event_timestamp
    LIMIT 10
)
CROSS JOIN UNNEST(event_params) as params WHERE params.key = 'firebase_screen_class'
GROUP BY params.key.ga_session_id



-- navigation paths by session
SELECT
    ARRAY_AGG(TIMESTAMP_MICROS(event_timestamp)) as timestamps,
    ARRAY_AGG(screen_params.value.string_value) as screens,
    session_id_params.value.int_value as session_id,
from (
    -- user journey
    SELECT event_timestamp, event_params, event_name, user_pseudo_id
    FROM `youareawesomeapp-c8835.analytics_213876904.*`
    WHERE event_name = 'screen_view'
    ORDER BY user_pseudo_id, event_timestamp
    LIMIT 1000
)
CROSS JOIN UNNEST(event_params) AS screen_params
CROSS JOIN UNNEST(event_params) AS session_id_params
WHERE screen_params.key = 'firebase_screen_class'
AND session_id_params.key = 'ga_session_id'
GROUP BY session_id

-- Example:
-- Row	timestamps                      screens	        session_id	
-- 1    2021-07-18 12:15:17.270001 UTC  MainActivity    1626610517
-- 2    2021-07-18 20:16:22.695001 UTC  MainActivity    1626639382
-- 3    2021-07-18 10:59:39.750001 UTC  MainActivity    1626605979
--      2021-07-18 10:59:48.515003 UTC  Favorites
--      2021-07-18 10:59:49.193005 UTC  Settings
