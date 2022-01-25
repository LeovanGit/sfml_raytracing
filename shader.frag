#version 460

in vec4 gl_FragCoord;
out vec4 frag_color;

uniform float time;
uniform vec2 screen;

float radius = 0.4;
vec3 center = vec3(0.0, 0.0, 0.0);

vec2 sphere_intersect(vec3 camera, vec3 ray)
{
    vec3 v = center - camera;
    float len_v = length(v);
    float pr_v = dot(v, normalize(ray));
    float sq_l = len_v * len_v - pr_v * pr_v;
    if (sq_l > radius * radius) return vec2(-1.0, -1.0);
    float x = sqrt(radius * radius - sq_l);
    return vec2(pr_v - x, pr_v + x);
}

void main()
{    
    vec2 xy = (gl_FragCoord.xy / vec2(screen.x, screen.y)) * 2.0f - 1.0f;
    xy *= vec2(1.0, screen.y / screen.x);

    vec3 camera = vec3(0.0, 0.0, 1.0);
    vec3 ray = vec3(xy, -1.0);
//    vec3 point_light = normalize(vec3(-1.0, -1.0, 1.0));
    vec3 point_light = normalize(vec3(sin(time), 1.0, cos(time)));

    float len_to_i_point = sphere_intersect(camera, ray).x;
    if (len_to_i_point > 0.0)
    {
        vec3 i_point = camera + ray * len_to_i_point;
        vec3 normal = normalize(i_point - center);
        float cosa = max(0.0, 1.0 - dot(normal, point_light)); // делить на модули не нужно ибо normalized

        frag_color = vec4(vec3(cosa), 1.0);
    }       
    else frag_color = vec4(vec3(0.2), 1.0);
}
