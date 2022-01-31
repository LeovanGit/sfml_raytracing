#version 460

#define PI (atan(1) * 4)

#define AMBIENT 0
#define DIFFUSE 1
#define REFLECTION 2
#define MIRROR 3

in vec4 gl_FragCoord;
out vec4 frag_color;

uniform float time;
uniform vec2 screen;

uniform vec2 mouse_pos;
uniform float zoom;

uniform bool shadows;
uniform bool real_point;
uniform bool mirror;
uniform bool colors;

struct Plane
{
    vec3 normal;
    float d;
    vec3 color;
    int material;
};

float is_intersect_plane(Plane plane, vec3 camera, vec3 ray)
{
    return -(plane.d + dot(camera, plane.normal)) / (dot(plane.normal, ray));
}

struct Sphere
{
    float radius;
    vec3 center;
    vec3 color;
    int material;
};

float is_intersect_sphere(Sphere sphere, vec3 camera, vec3 ray)
{
    vec3 v = sphere.center - camera;
    float len_v = length(v);
    float pr_v = dot(v, normalize(ray));
    float sq_l = len_v * len_v - pr_v * pr_v;
    float sq_radius = sphere.radius * sphere.radius;
    if (sq_l > sq_radius) return -1.0;
    float x = sqrt(sq_radius - sq_l);
    return pr_v - x;
}
vec3 rotate_x(vec3 point, float angle)
{
    angle *= PI / 180;
    return vec3(point.x,                
                point.z * sin(angle) + point.y * cos(angle),
                point.z * cos(angle) - point.y * sin(angle));
}

vec3 rotate_y(vec3 point, float angle)
{
    angle *= PI / 180;
    return vec3(point.z * sin(angle) + point.x * cos(angle),
                point.y,
                point.z * cos(angle) - point.x * sin(angle));                
}

vec3 rotate_z(vec3 point, float angle)
{
    angle *= PI / 180;
    return vec3(point.x * cos(angle) - point.y * sin(angle),
                point.x * sin(angle) + point.y * cos(angle),
                point.z);
}

float sq_distance(vec3 a, vec3 b)
{
    return (a.x - b.x) * (a.x - b.x) +
           (a.y - b.y) * (a.y - b.y) +
           (a.z - b.z) * (a.z - b.z);
}

// ----------------------------------------------------------------------
vec3 point_light = vec3(1.0);
uniform float light_power;
float shadow_power = 0.6;
float reflection_weakness = 30.0;

Sphere spheres[] = 
{
    Sphere(0.25, vec3(0.3, 0.25, 0.3), vec3(0.76, 0.13, 0.13), REFLECTION),
    Sphere(0.25, vec3(-0.3, 0.25, 0.3), vec3(0.13, 0.68, 0.76), DIFFUSE),
    Sphere(0.25, vec3(0.0, 0.25, -0.3), vec3(1.0, 0.6, 0.47), DIFFUSE),
    Sphere(0.4, vec3(-0.9, 0.4, -0.5), vec3(0.6, 0.99, 0.6), MIRROR),
    // Sphere(0.3, vec3(-1.2, 0.0, 0.3), vec3(0.6, 0.99, 0.6), MIRROR)
};
const int spheres_size = spheres.length();  
    
Plane planes[] = 
{
    Plane(normalize(vec3(0.0, 1.0, 0.0)), 0.0, vec3(0.48, 0.45, 0.35), DIFFUSE)
};
const int planes_size = planes.length();
float plane_size = 2.0;

// ----------------------------------------------------------------------
vec3 i_point = vec3(-1.0);
vec3 normal = vec3(0.0);
vec3 color = vec3(-1.0);
int material = -1;

bool ray_cast(vec3 origin, vec3 ray, bool only_shadow_check)
{
    float len_to_i_point = -1.0;

    for (int i = 0; i != spheres_size; ++i)
    {
        float current_len = is_intersect_sphere(spheres[i], origin, ray);
        {
            if (current_len > 0.0 && (current_len < len_to_i_point || len_to_i_point < 0.0))
            {
                if (only_shadow_check) return true;
                len_to_i_point = current_len;
                i_point = origin + ray * len_to_i_point;
                normal = normalize(i_point - spheres[i].center);
                color = spheres[i].color;
                material = spheres[i].material;
            }
        }
    }
    
    for (int i = 0; i != planes_size; ++i)
    {
        float current_len = is_intersect_plane(planes[i], origin, ray);
        if (current_len > 0.0 && (current_len < len_to_i_point || len_to_i_point < 0.0))
        {
            if (only_shadow_check) return true;
            i_point = origin + ray * current_len;
 
            if (i_point.x >= planes[i].d - plane_size && i_point.x <= planes[i].d + plane_size &&
                i_point.y >= planes[i].d - plane_size && i_point.y <= planes[i].d + plane_size &&
                i_point.z >= planes[i].d - plane_size && i_point.z <= planes[i].d + plane_size)
            {
                len_to_i_point = current_len;
                normal = planes[i].normal;
                material = planes[i].material;

                // color = planes[i].color;
                // only horizontal xz chessboard
                int block_count = 10;
                float block_size = 2 * plane_size / block_count;
                ivec2 block = ivec2(int(abs(i_point.x - planes[i].d - plane_size) / block_size),
                                    int(abs(i_point.z - planes[i].d - plane_size) / block_size));
               if (bool((block.x % 2) ^ (block.y % 2))) color = vec3(0.62, 0.66, 0.52);
               else color = vec3(0.9, 0.9, 0.77);
            }
        }
    }

    if (only_shadow_check) return false;
    return len_to_i_point >= 0.0;
}

float calc_shadow()
{
    // for multiplie light sources need to check if intersection len less than
    // len from i_point to point_light
    vec3 shadow_ray = normalize(point_light - i_point); // from i_point to light source
    // + normal * 0.0001 because any ray from i_point intersect i_point (self intersection)
    vec3 shadow_orig = i_point + normal * 0.0001;

//    if (dot(normal, normalize(point_light)) > 0.0)
    {
        if (ray_cast(shadow_orig, shadow_ray, true)) return shadow_power;
    } return 1.0;
}

// call only after successful ray_cast() !!!
float calc_light(vec3 origin, vec3 ray)
{
    vec3 old_normal = normal;
    float cosa = max(0.0, dot(normal, normalize(point_light)));
 
    if (material == REFLECTION) 
    {
        vec3 reflected_ray = ray - 2.0 * dot(ray, normal) * normal;
        float cosb = max(0.0, dot(reflected_ray, normalize(point_light)));
        cosb = pow(cosb, reflection_weakness);
        cosa += cosb;
    }
    else if (material == MIRROR && mirror)
    {
        float rpl = 1.0f;
        if (real_point) rpl = light_power / sq_distance(i_point, point_light);
        vec3 reflected_ray = ray - 2.0 * dot(ray, normal) * normal;
        if (ray_cast(i_point + normal * 0.0001, reflected_ray, false))
        {
            cosa = max(0.0, dot(normal, normalize(point_light))) * 0.95;
        }
        else
        {
            color = vec3(1.0); // bad
            cosa = 0.2 * 0.95; // 0.95 just for did not merge mirror sphere and env
        }

        // create REFLECTION func in future
        reflected_ray = ray - 2.0 * dot(ray, old_normal) * old_normal; // use first ray!
        float cosb = max(0.0, dot(reflected_ray, normalize(point_light)));
        cosb = pow(cosb, reflection_weakness);
        return (cosa + cosb) * rpl * light_power;
    }

    if (real_point) cosa *= light_power / sq_distance(i_point, point_light); // real point light
    if (shadows) return cosa * light_power * calc_shadow();
    return cosa * light_power;
}

void main()
{    
    vec2 xy = (gl_FragCoord.xy / vec2(screen.x, screen.y)) * vec2(2.0) - vec2(1.0);
    xy *= vec2(1.0, screen.y / screen.x);

    vec3 camera = vec3(0.0, 0.0, zoom);
    vec3 ray = normalize(vec3(xy, -1.0));

    camera = rotate_x(camera, 5);
    ray = rotate_x(ray, 5);

    camera = rotate_x(camera, mouse_pos.y);
    ray = rotate_x(ray, mouse_pos.y);

    camera = rotate_y(camera, mouse_pos.x);
    ray = rotate_y(ray, mouse_pos.x);

    if (ray_cast(camera, ray, false)) 
    {
        if (colors) frag_color = vec4(vec3(calc_light(camera, ray) * color), 1.0);
        else frag_color = vec4(vec3(calc_light(camera, ray)), 1.0);
    }
    else frag_color = vec4(vec3(0.2), 1.0);
}
