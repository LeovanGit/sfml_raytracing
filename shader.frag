#version 460

#define PI (atan(1) * 4)

in vec4 gl_FragCoord;
out vec4 frag_color;

uniform float time;
uniform vec2 screen;

//==================================================
struct Plane
{
    vec3 normal;
    float d;
    vec3 color;
};

void init_plane(inout Plane ths, vec3 normal, float d)
{
    ths.normal = normal;
    ths.d = d;
}

float is_intersect_plane(Plane plane, vec3 camera, vec3 ray)
{
    return -(plane.d + dot(camera, plane.normal)) / (dot(plane.normal, ray));
}
//==================================================
struct Sphere
{
    float radius;
    vec3 center;
    vec3 color;
};

void init_sphere(inout Sphere ths, float radius, vec3 center, vec3 color)
{
    ths.radius = radius;
    ths.center = center;
    ths.color = color;
}

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
//==================================================
vec3 rotate_x(vec3 point, float angle)
{
    angle = angle * PI / 180;
    return vec3(point.x,                
                point.z * sin(angle) + point.y * cos(angle),
                point.z * cos(angle) - point.y * sin(angle));
}

vec3 rotate_y(vec3 point, float angle)
{
    angle = angle * PI / 180;
    return vec3(point.z * sin(angle) + point.x * cos(angle),
                point.y,
                point.z * cos(angle) - point.x * sin(angle));                
}

vec3 rotate_z(vec3 point, float angle)
{
    angle = angle * PI / 180;
    return vec3(point.x * cos(angle) - point.y * sin(angle),
                point.x * sin(angle) + point.y * cos(angle),
                point.z);
}
//==================================================
float sq_distance(vec3 a, vec3 b)
{
    return (a.x - b.x) * (a.x - b.x) +
           (a.y - b.y) * (a.y - b.y) +
           (a.z - b.z) * (a.z - b.z);
}
//==================================================

void main()
{    
    vec2 xy = (gl_FragCoord.xy / vec2(screen.x, screen.y)) * vec2(2.0) - vec2(1.0);
    xy *= vec2(1.0, screen.y / screen.x);


    vec3 camera = vec3(0.0, 0.0, 2.0);
    vec3 ray = normalize(vec3(xy, -1.0));

    camera = rotate_x(camera, 15);
    ray = rotate_x(ray, 15);

    camera = rotate_y(camera, time * 10);
    ray = normalize(rotate_y(ray, time * 10));
    
    vec3 point_light = vec3(1.0); // static
//    vec3 point_light = vec3(abs(5.0 * sin(time / 7.0))); // move from vec3(0.0) to vec3(5.0)
//    vec3 point_light =vec3(2.0 * abs(cos(time / 5.0)) + 0.5); // move from 2.5 to 0.5
//    vec3 point_light = vec3(sin(time), 1.0, cos(time)); // rotate around
    float light_power = 2; // 1

    const int spheres_size = 4;    
    Sphere spheres[spheres_size] = {Sphere(0.25, vec3(0.3, 0.25, 0.3), vec3(0.76, 0.13, 0.13)),
                                    Sphere(0.25, vec3(-0.3, 0.25, 0.3), vec3(0.13, 0.68, 0.76)),
                                    Sphere(0.25, vec3(0.0, 0.25, -0.3), vec3(1.0, 0.6, 0.47)),
                                    Sphere(0.4, vec3(-0.9, 0.25, -0.5), vec3(0.6, 0.99, 0.6))};
    
    const int planes_size = 1;
    Plane planes[planes_size] = {Plane(normalize(vec3(0.0, 1.0, 0.0)), 0.0, vec3(1.0))};

    float len_to_i_point = -1.0;
    vec3 i_point = vec3(-1.0);
    float cosa = -1.0;
    vec3 color = vec3(1.0);

    for (int i = 0; i != spheres_size; ++i)
    {
        float current_len = is_intersect_sphere(spheres[i], camera, ray);
        {
            if (current_len > 0.0 && (current_len < len_to_i_point || len_to_i_point < 0.0))
            {
                len_to_i_point = current_len;
                color = spheres[i].color;
                i_point = camera + ray * len_to_i_point;
                vec3 normal = normalize(i_point - spheres[i].center);
                cosa = max(0.0, dot(normal, normalize(point_light)));
            }
        }
    }
    
    float plane_size = 2.0;
    for (int i = 0; i != planes_size; ++i)
    {
        float current_len = is_intersect_plane(planes[i], camera, ray);
        if (current_len > 0.0 && (current_len < len_to_i_point || len_to_i_point < 0.0))
        {
            len_to_i_point = current_len;
            i_point = camera + ray * len_to_i_point;
            color = planes[i].color;
            // limit plane size
            if (i_point.x >= planes[i].d - plane_size && i_point.x <= planes[i].d + plane_size &&
                i_point.y >= planes[i].d - plane_size && i_point.y <= planes[i].d + plane_size &&
                i_point.z >= planes[i].d - plane_size && i_point.z <= planes[i].d + plane_size)
            {
                // cosa = dot(planes[i].normal, normalize(point_light));
                // chessboard (only for xz plane)
                int frequency = 20; // how many blocks in line
                float block_size = 2 * plane_size / frequency; // 0.2
                // len from i_point to plane order instead of coordinates (explained in README)
                vec2 block = 
                    vec2((planes[i].d - plane_size + i_point.x) / block_size,
                         (planes[i].d - plane_size + i_point.z) / block_size);
                if (bool(int(block.x) % 2 ^ int(block.y) % 2)) cosa = 0.0;
                else cosa = 1.0;
            }
        }
    }
    
    if (cosa >= 0.0)
    {
        cosa = cosa * light_power / sq_distance(i_point, point_light); // real point light
        frag_color = vec4(vec3(color * cosa), 1.0);
    } else frag_color = vec4(vec3(0.2), 1.0);
}
