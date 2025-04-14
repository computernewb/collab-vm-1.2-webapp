<template>
    <div class="table-responsive vm-username-table">
        <table class="table table-hover table-borderless">
            <thead>
                <tr>
                    <th class="bg-body-tertiary">
                        <FontAwesomeIcon :icon="['fa-solid', 'fa-user']"/>
                        Users Online: <span class="vm-online-user-count">{{ users.length }}</span>
                    </th>                    
                </tr>
            </thead>
            <tbody>
                <tr v-for="user in usersSorted">
                    <td class="vm-username-table-user" :class="userClass(user)">
                        <span class="vm-username-table-username">{{ user.username }}</span>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { User } from '../../ts/protocol/User';
import { Rank } from '../../ts/protocol/Permissions';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

    export default defineComponent({
        props: {
            users: {
                type: Array<User>,
                required: true
            }
        },
        methods: {
            userClass(user: User) {
                let classlist = [];
                switch (user.rank) {
                    case Rank.Admin: {
                        classlist.push("user-admin");
                        break;
                    }
                    case Rank.Moderator: {
                        classlist.push("user-moderator");
                        break;
                    }
                    case Rank.Registered: {
                        classlist.push("user-registered");
                        break;
                    }
                    case Rank.Unregistered: {
                        classlist.push("user-unregistered");
                        break;
                    }
                }

                if (user.turn === 0) {
                    classlist.push("user-turn");
                } else if (user.turn > 0) {
                    classlist.push("user-waiting");
                }

                return classlist;
            },
        },
        computed: {
            usersSorted() {
                return this.users.sort((a, b) => {
                    // Current turn
                    if (a.turn === 0) return -1;
                    if (b.turn === 0) return 1;
                    // Waiting
                    if (a.turn > b.turn) return -1;
                    if (b.turn > a.turn) return 1;
                    // Admin
                    if (a.rank === Rank.Admin && b.rank !== Rank.Admin) return -1;
                    if (b.rank === Rank.Admin && a.rank !== Rank.Admin) return 1;
                    // Mod
                    if (a.rank === Rank.Moderator && b.rank !== Rank.Moderator) return -1;
                    if (b.rank === Rank.Moderator && a.rank !== Rank.Moderator) return 1;
                    // Registered
                    if (a.rank === Rank.Registered && b.rank !== Rank.Registered) return -1;
                    if (b.rank === Rank.Registered && a.rank !== Rank.Registered) return 1;
                    // Equal
                    return 0;
                })
            }
        },
        components: {
            FontAwesomeIcon
        }
    });
</script>