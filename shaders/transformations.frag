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
